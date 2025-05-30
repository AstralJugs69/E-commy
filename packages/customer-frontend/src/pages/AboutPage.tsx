import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { FaStore } from 'react-icons/fa';

const AboutPage: React.FC = () => {
  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <div className="text-center mb-4">
            <FaStore className="text-primary mb-3" size={40} />
            <h2 className="mb-4">About HybridStore</h2>
          </div>
          
          <Card className="shadow-sm mb-4">
            <Card.Body className="p-4">
              <p className="lead mb-4">
                Welcome to HybridStore, your one-stop destination for quality products with convenient pickup and delivery options.
              </p>
              
              <p>
                At HybridStore, we combine the convenience of online shopping with the personalized experience of traditional retail. 
                Our unique hybrid model ensures that you get the best of both worlds: browse and order online, then confirm your order 
                with a quick verification call.
              </p>
              
              <p>
                More information about our store, policies, and our mission will be available here soon.
              </p>
            </Card.Body>
          </Card>
          
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <h4 className="mb-3">Contact Information</h4>
              <Row>
                <Col md={6}>
                  <h6 className="fw-semibold mb-2">Customer Support</h6>
                  <p className="mb-1">Email: support@hybridstore.com</p>
                  <p className="mb-1">Phone: (123) 456-7890</p>
                  <p className="mb-3">Hours: Monday-Friday, 9AM-6PM</p>
                </Col>
                <Col md={6}>
                  <h6 className="fw-semibold mb-2">Main Office</h6>
                  <p className="mb-1">123 Commerce St</p>
                  <p className="mb-1">Business City, State 12345</p>
                  <p className="mb-1">United States</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AboutPage; 