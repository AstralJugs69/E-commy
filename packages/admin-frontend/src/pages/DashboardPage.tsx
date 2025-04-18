import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Alert, Spinner, Button, Table, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate, getStatusBadgeVariant } from '../utils/formatters';

interface AdminStats {
  recentOrders: {
    id: number;
    customerName: string;
    status: string;
    totalAmount: number;
    createdAt: string;
  }[];
}

interface ShippingDetails {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
}

interface AdminOrder {
  id: number;
  userId: number;
  status: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  shippingDetails: ShippingDetails;
  customerName: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
const REFRESH_INTERVAL_MS = 30000; // 30 seconds

const DashboardPage = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Live order view states
  const [activeOrders, setActiveOrders] = useState<AdminOrder[]>([]);
  const [isLoadingActive, setIsLoadingActive] = useState(true);
  const [activeError, setActiveError] = useState<string | null>(null);
  const refreshIntervalIdRef = useRef<number | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const admin_token = localStorage.getItem('admin_token');
        
        if (!admin_token) {
          setError('Authentication token not found. Please log in again.');
          setTimeout(() => {
            navigate('/login');
          }, 3000);
          return;
        }

        // Ensure the token is properly formatted
        const formattedToken = admin_token.startsWith('Bearer ') 
          ? admin_token 
          : `Bearer ${admin_token}`;
        
        const response = await axios.get(`${API_BASE_URL}/admin/stats`, {
          headers: {
            Authorization: formattedToken
          }
        });
        
        setStats(response.data);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 401) {
            // Handle unauthorized error
            localStorage.removeItem('admin_token');
            setError('Your session has expired. Please log in again.');
            setTimeout(() => {
              navigate('/login');
            }, 3000);
          } else if (err.response) {
            setError(err.response.data.message || 'Failed to fetch dashboard data');
            console.error('Error fetching dashboard data:', err.response.data);
          } else {
            setError('Network error. Please check your connection.');
            console.error('Network error:', err);
          }
        } else {
          setError('An unexpected error occurred.');
          console.error('Error fetching dashboard data:', err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const fetchActiveOrders = async () => {
    setIsLoadingActive(true);
    setActiveError(null);
    
    try {
      const admin_token = localStorage.getItem('admin_token');
      
      if (!admin_token) {
        setActiveError('Authentication token not found. Please log in again.');
        return;
      }

      // Ensure the token is properly formatted
      const formattedToken = admin_token.startsWith('Bearer ') 
        ? admin_token 
        : `Bearer ${admin_token}`;
      
      // Pass status params correctly for backend array handling
      const apiUrl = `${API_BASE_URL}/admin/orders?status=Pending+Call&status=Verified&dateFilter=today`; // Focus on today's active orders
      console.log(`Fetching active orders from ${apiUrl}`);
      
      // Fetch orders with Pending Call or Verified status
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: formattedToken
        }
      });
      
      // Update state with fetched orders
      if (response.data && Array.isArray(response.data.orders)) {
        setActiveOrders(response.data.orders);
      } else {
        setActiveError('Invalid data format received from server.');
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          setActiveError('Your session has expired. Please log in again.');
        } else if (err.response) {
          setActiveError(err.response.data.message || 'Failed to fetch active orders');
          console.error('Error fetching active orders:', err.response.data);
        } else {
          setActiveError('Network error. Please check your connection.');
          console.error('Network error:', err);
        }
      } else {
        setActiveError('An unexpected error occurred.');
        console.error('Error fetching active orders:', err);
      }
    } finally {
      setIsLoadingActive(false);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      const admin_token = localStorage.getItem('admin_token');
      
      if (!admin_token) {
        setActiveError('Authentication token not found. Please log in again.');
        return;
      }

      // Ensure the token is properly formatted
      const formattedToken = admin_token.startsWith('Bearer ') 
        ? admin_token 
        : `Bearer ${admin_token}`;
      
      // Update the order status
      await axios.put(
        `${API_BASE_URL}/admin/orders/${orderId}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: formattedToken,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Refresh the orders after status update
      fetchActiveOrders();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setActiveError(err.response?.data?.message || 'Failed to update order status');
        console.error('Error updating order status:', err);
      } else {
        setActiveError('An unexpected error occurred.');
        console.error('Error updating order status:', err);
      }
    }
  };

  // Set up auto-refresh for active orders
  useEffect(() => {
    // Initial fetch
    fetchActiveOrders();
    
    // Set up interval for refreshing
    refreshIntervalIdRef.current = window.setInterval(fetchActiveOrders, REFRESH_INTERVAL_MS);
    
    // Clean up on component unmount
    return () => {
      if (refreshIntervalIdRef.current) {
        window.clearInterval(refreshIntervalIdRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <Container className="py-4">
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading dashboard...</span>
          </Spinner>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger" className="my-4">
          {error}
        </Alert>
        <Button variant="primary" onClick={() => navigate('/login')}>
          Go to Login
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Dashboard</h2>
        <div>
          <Link to="/admin/statistics" className="me-2">
            <Button variant="primary">View Statistics</Button>
          </Link>
          <Button variant="outline-primary" onClick={() => window.location.reload()}>Refresh Data</Button>
        </div>
      </div>
      
      {/* Live Orders Section */}
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-light">
          <h3 className="h5 mb-0">Live Orders (Pending Call / Verified - Today)</h3>
        </Card.Header>
        <Card.Body>
          {isLoadingActive ? (
            <div className="text-center my-4">
              <Spinner animation="border" size="sm" className="me-2" />
              <span>Loading live orders...</span>
            </div>
          ) : activeError ? (
            <Alert variant="danger">{activeError}</Alert>
          ) : activeOrders.length > 0 ? (
            <Row xs={1} md={2} lg={3} className="g-3">
              {activeOrders.map(order => (
                <Col key={order.id}>
                  <Card className="h-100 border">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                      <span>
                        <strong>Order #{order.id}</strong>
                      </span>
                      <Badge bg={getStatusBadgeVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-2">
                        <strong>Customer:</strong> {order.shippingDetails?.fullName || order.customerName || 'N/A'}
                      </div>
                      <div className="mb-2">
                        <strong>Phone:</strong> {order.shippingDetails?.phone || 'N/A'}
                      </div>
                      <div className="mb-2">
                        <strong>Total:</strong> {formatCurrency(order.totalAmount)}
                      </div>
                      <div className="mb-2">
                        <strong>Created:</strong> {formatDate(order.createdAt)}
                      </div>
                    </Card.Body>
                    <Card.Footer className="d-flex justify-content-between">
                      {order.status === 'Pending Call' && (
                        <Button 
                          variant="success" 
                          size="sm"
                          onClick={() => handleStatusChange(order.id, 'Verified')}
                        >
                          Mark Verified
                        </Button>
                      )}
                      <Link to={`/admin/orders/${order.id}`} className="ms-auto">
                        <Button variant="outline-secondary" size="sm">
                          Details
                        </Button>
                      </Link>
                    </Card.Footer>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Alert variant="info">
              No active orders found for today. New orders will appear here automatically.
            </Alert>
          )}
        </Card.Body>
        <Card.Footer className="text-muted">
          <small>Auto-refreshes every {REFRESH_INTERVAL_MS / 1000} seconds</small>
        </Card.Footer>
      </Card>
      
      {/* Recent Orders */}
      <Row className="mb-4">
        <Col lg={12}>
          <Card className="shadow-sm">
            <Card.Header className="bg-transparent py-3">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Recent Orders</h5>
                <Link to="/admin/orders">
                  <Button variant="outline-secondary" size="sm">View All</Button>
                </Link>
              </div>
            </Card.Header>
            <Card.Body>
              {stats && stats.recentOrders && stats.recentOrders.length > 0 ? (
                <Table hover responsive size="sm">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Customer</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentOrders.map(order => (
                      <tr key={order.id}>
                        <td>#{order.id}</td>
                        <td>{order.customerName}</td>
                        <td>{formatCurrency(order.totalAmount)}</td>
                        <td>
                          <Badge bg={getStatusBadgeVariant(order.status)}>
                            {order.status}
                          </Badge>
                        </td>
                        <td>{formatDate(order.createdAt)}</td>
                        <td>
                          <Link to={`/admin/orders/${order.id}`}>
                            <Button variant="outline-primary" size="sm">View</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center py-3">No recent orders found.</div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default DashboardPage; 