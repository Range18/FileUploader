import { Type } from '@nestjs/common';
import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  FindOptions,
  Repository,
} from 'typeorm';

type ExtractTypeOrNever<T, K> = T extends undefined ? never : K;

export interface IBaseEntityService<
  Entity extends object,
  EntityDto = undefined,
> {
  findOne(options: FindOneOptions<Entity>): Promise<Entity>;

  find(options: FindOptions<Entity>): Promise<Entity[]>;

  save(entity: Entity): Promise<Entity>;

  updateOne(
    optionsOrEntity: FindOneOptions<Entity> | Entity,
    toUpdate: DeepPartial<Entity>,
  ): Promise<Entity>;

  removeOne(optionsOrEntity: FindOneOptions<Entity> | Entity): Promise<void>;

  remove(optionsOrEntities: FindManyOptions<Entity> | Entity[]): Promise<void>;

  formatToDto(entity: Entity): EntityDto;
}

export abstract class BaseEntityService<
  Entity extends object,
  EntityDto = undefined,
> implements IBaseEntityService<Entity, EntityDto>
{
  protected constructor(entityRepository: Repository<Entity>);
  protected constructor(
    entityRepository: Repository<Entity>,
    entityDto: ExtractTypeOrNever<EntityDto, Type<EntityDto>>,
  );
  protected constructor(
    private readonly entityRepository: Repository<Entity>,
    private readonly entityDto: ExtractTypeOrNever<
      EntityDto,
      Type<EntityDto>
    > = undefined,
  ) {}
  async find(options: FindManyOptions<Entity>): Promise<Entity[]> {
    if (Object.values(options.where).includes(undefined)) {
      throw new Error('Properties in the options.where must be defined');
    }

    return await this.entityRepository.find(options);
  }

  async findOne(options: FindOneOptions<Entity>): Promise<Entity> {
    if (Object.values(options.where).includes(undefined)) {
      throw new Error('Properties in the options.where must be defined');
    }

    return await this.entityRepository.findOne(options);
  }

  async save(entity: Entity): Promise<Entity>;
  async save(entities: Entity[]): Promise<Entity[]>;
  async save(entities: Entity | Entity[]): Promise<Entity | Entity[]> {
    if (Array.isArray(entities)) {
      return this.entityRepository.save(entities);
    } else {
      return this.entityRepository.save(entities);
    }
  }

  async remove(
    optionsOrEntities: FindManyOptions<Entity> | Entity[],
  ): Promise<void> {
    const entity: Entity[] =
      'where' in <object>optionsOrEntities
        ? await this.entityRepository.find(
            optionsOrEntities as FindManyOptions<Entity>,
          )
        : (optionsOrEntities as Entity[]);

    await this.entityRepository.remove(entity);
  }

  async removeOne(
    optionsOrEntity: FindOneOptions<Entity> | Entity,
  ): Promise<void> {
    const entity: Entity =
      'where' in <object>optionsOrEntity
        ? await this.entityRepository.findOne(optionsOrEntity)
        : (optionsOrEntity as Entity);

    await this.entityRepository.remove(entity);
  }

  async updateOne(
    optionsOrEntity: FindOneOptions<Entity> | Entity,
    toUpdate: DeepPartial<Entity>,
  ): Promise<Entity> {
    const entity: Entity =
      'where' in <object>optionsOrEntity
        ? await this.entityRepository.findOne(optionsOrEntity)
        : (optionsOrEntity as Entity);

    this.entityRepository.merge(entity, toUpdate);

    return this.entityRepository.save(entity);
  }

  formatToDto(entity: Entity): EntityDto {
    return new this.entityDto(entity);
  }
}
