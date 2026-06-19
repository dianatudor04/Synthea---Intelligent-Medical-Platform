import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ApiError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

// All handlers are admin-only (enforced at the route level).

export const listPools = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const pools = await prisma.pool.findMany({
      orderBy: { tag: 'asc' },
      include: { items: { orderBy: { createdAt: 'asc' } } },
    });
    res.json({ data: pools });
  } catch (err) {
    next(err);
  }
};

export const createPool = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const pool = await prisma.pool.create({ data: req.body });
    res.status(201).json(pool);
  } catch (err) {
    next(err);
  }
};

export const updatePool = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const pool = await prisma.pool.update({ where: { id: req.params.id }, data: req.body });
    res.json(pool);
  } catch (err) {
    next(err);
  }
};

export const deletePool = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.pool.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

export const createItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const pool = await prisma.pool.findUnique({ where: { id: req.params.id }, select: { id: true } });
    if (!pool) throw new ApiError(404, 'Pool not found');
    const item = await prisma.poolItem.create({ data: { ...req.body, poolId: pool.id } });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
};

export const updateItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const item = await prisma.poolItem.update({ where: { id: req.params.itemId }, data: req.body });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

export const deleteItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.poolItem.delete({ where: { id: req.params.itemId } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
