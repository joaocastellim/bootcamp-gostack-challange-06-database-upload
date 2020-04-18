import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    if (type === 'outcome') {
      const { total } = await transactionsRepository.getBalance();
      if (total < value) {
        throw new AppError(
          `Insufficient funds. Don't have money enough to complete this transaction!`,
          400,
        );
      }
    }

    const categoriesRepository = getRepository(Category);

    let categoryFind = await categoriesRepository.findOne({
      where: { title: category },
    });

    if (!categoryFind) {
      categoryFind = categoriesRepository.create({ title: category });

      await categoriesRepository.save(categoryFind);
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id: categoryFind.id,
    });
    await transactionsRepository.save(transaction);
    return transaction;
  }
}

export default CreateTransactionService;
