import { Router, Request, Response, RequestHandler } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';
import { isAdmin } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const categorySchema = z.object({
  name: z.string().min(1, { message: "Category name is required" }).max(100),
  description: z.string().optional(),
  imageUrl: z.string().url({ message: "Invalid URL format" }).optional().or(z.literal('')), // Allow empty string or valid URL
});

const updateCategorySchema = categorySchema.partial();

/**
 * @route POST /api/admin/categories
 * @description Create a new category
 * @access Admin
 */
router.post('/', isAdmin, (async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = categorySchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: validationResult.error.flatten().fieldErrors
      });
      return;
    }

    const { name, description, imageUrl } = validationResult.data;

    // Create the category with type safety
    const categoryData: Prisma.CategoryCreateInput = {
      name,
      description: description || null, // Ensure null if empty/undefined
      imageUrl: imageUrl || null // Ensure null if empty/undefined
    };

    const newCategory = await prisma.category.create({
      data: categoryData
    });

    res.status(201).json(newCategory);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002 is the error code for unique constraint violation
      if (error.code === 'P2002') {
        res.status(409).json({ message: 'A category with this name already exists.' });
        return;
      }
    }

    console.error('Error creating category:', error);
    res.status(500).json({ message: 'An error occurred while creating the category.' });
  }
}) as RequestHandler);

/**
 * @route GET /api/admin/categories
 * @description Get all categories
 * @access Admin
 */
router.get('/', isAdmin, (async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    res.status(200).json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'An error occurred while fetching categories.' });
  }
}) as RequestHandler);

/**
 * @route PUT /api/admin/categories/:categoryId
 * @description Update a category
 * @access Admin
 */
router.put('/:categoryId', isAdmin, (async (req: Request, res: Response) => {
  try {
    // Validate ID param
    const categoryId = parseInt(req.params.categoryId);
    if (isNaN(categoryId)) {
      res.status(400).json({ message: 'Invalid category ID.' });
      return;
    }

    // Validate request body
    const validationResult = updateCategorySchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: validationResult.error.flatten().fieldErrors
      });
      return;
    }

    // Check if category exists (use findUniqueOrThrow for cleaner error handling)
    await prisma.category.findUniqueOrThrow({
      where: { id: categoryId }
    }).catch(() => { throw { status: 404, message: 'Category not found.' } });


    // Create update data with proper typing
    const updateData: Prisma.CategoryUpdateInput = {};

    if (validationResult.data.name !== undefined) {
      updateData.name = validationResult.data.name;
    }

    if (validationResult.data.description !== undefined) {
      updateData.description = validationResult.data.description || null; // Set to null if empty string
    }

    if (validationResult.data.imageUrl !== undefined) {
      updateData.imageUrl = validationResult.data.imageUrl || null; // Set to null if empty string
    }

    // Update the category
    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: updateData
    });

    res.status(200).json(updatedCategory);
  } catch (error: any) {
    // Handle specific errors first
    if (error?.status === 404) {
        return res.status(404).json({ message: error.message });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002 is the error code for unique constraint violation
      if (error.code === 'P2002') {
        res.status(409).json({ message: 'A category with this name already exists.' });
        return;
      }
    }

    console.error('Error updating category:', error);
    res.status(500).json({ message: 'An error occurred while updating the category.' });
  }
}) as RequestHandler);

/**
 * @route DELETE /api/admin/categories/:categoryId
 * @description Delete a category
 * @access Admin
 */
router.delete('/:categoryId', isAdmin, (async (req: Request, res: Response) => {
  try {
    // Validate ID param
    const categoryId = parseInt(req.params.categoryId);
    if (isNaN(categoryId)) {
      res.status(400).json({ message: 'Invalid category ID.' });
      return;
    }

    // Check if category exists and if it has products in one go
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { _count: { select: { products: true } } } // Count associated products
    });

    if (!existingCategory) {
      res.status(404).json({ message: 'Category not found.' });
      return;
    }

    // Check if category has associated products
    if (existingCategory._count.products > 0) {
      res.status(409).json({ message: `Cannot delete category "${existingCategory.name}" as it has ${existingCategory._count.products} associated products.` });
      return;
    }

    // Delete the category
    await prisma.category.delete({
      where: { id: categoryId }
    });

    res.status(204).send();
  } catch (error: any) {
    // Check for specific Prisma errors if needed, though findUnique handles not found
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
       // P2003 might still happen if relations change, though the check above should prevent it
       if (error.code === 'P2003') {
         return res.status(409).json({ message: 'Cannot delete category due to existing references.' });
       }
    }

    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'An error occurred while deleting the category.' });
  }
}) as RequestHandler);

export default router;