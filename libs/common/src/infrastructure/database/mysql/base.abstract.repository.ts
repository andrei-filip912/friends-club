import { BaseInterfaceRepository } from '../../../domain/Interfaces/mysql.interface.repository';
import { DeleteResult, FindOptionsWhere, ObjectLiteral, Repository } from 'typeorm';
import { AbstractEntity } from './base.abstract.entity';
import { AggregateRoot } from '@nestjs/cqrs';
import { EntityDbEntityFactory } from './entity-dbEntity.factory';
import { NotFoundException } from '@nestjs/common';

export abstract class BaseAbstractRepository<
  TDbEntity extends AbstractEntity,
  TEntity extends AggregateRoot,
> implements BaseInterfaceRepository<TEntity>
{
  protected readonly respository: Repository<TDbEntity>;
  protected readonly entityDbEntityFactory: EntityDbEntityFactory<
    TDbEntity,
    TEntity
  >;
  protected constructor(
    respository: Repository<TDbEntity>,
    entityDbEntityFactory: EntityDbEntityFactory<TDbEntity, TEntity>,
  ) {
    this.respository = respository;
    this.entityDbEntityFactory = entityDbEntityFactory;
  }

  public async create(data: TEntity | any): Promise<TEntity> {
    return this.respository.save(data);
  }

  public async findOneById(id: number): Promise<TEntity> {
    const dbEntity = await this.respository.findOne({
      where: { id } as FindOptionsWhere<TDbEntity>,
    });

    if (!dbEntity) {
      throw new NotFoundException('Could no find the required post.');
    }

    const entity = this.entityDbEntityFactory.createFromDbEntity(dbEntity);
    return entity;
  }

  public async findOneAndReplaceById(
    id: number,
    replacement: TEntity,
  ): Promise<TEntity> {
    const dbEntity = await this.respository.findOne({
      where: { id } as FindOptionsWhere<TDbEntity>,
    });
    if (!dbEntity) {
      throw new NotFoundException('Could no find the required post.');
    }

    const replacementDbEntity = this.entityDbEntityFactory.create(replacement);

    // Update the entity in the database
    this.respository.update(id, replacementDbEntity);
    return replacement;
  }

  public async findByCondition(filterCondition: any): Promise<TEntity | null> {
    const dbEntity = await this.respository.findOne({ where: filterCondition });

    // Use your factory to create the domain entity
    if (dbEntity) {
      const entity = this.entityDbEntityFactory.createFromDbEntity(dbEntity);
      return entity;
    }
    return null;
  }

  public async findWithRelations(relations: any): Promise<TEntity[]> {
    const dbEntities = await this.respository.find(relations);

    // Use your factory to create the domain entity
    const entities: TEntity[] = [];
    if (dbEntities) {
      dbEntities.forEach((element) => {
        entities.push(this.entityDbEntityFactory.createFromDbEntity(element));
      });
    }
    return entities;
  }

  public async findAll(): Promise<TEntity[]> {
    const dbEntities = await this.respository.find();

    // Use your factory to create the domain entity
    const entities: TEntity[] = [];
    if (dbEntities) {
      dbEntities.forEach((element) => {
        entities.push(this.entityDbEntityFactory.createFromDbEntity(element));
      });
    }
    return entities;
  }

  public async remove(id: string): Promise<DeleteResult> {
    return await this.respository.delete(id);
  }
}
