import { NotFoundException, Type } from '@nestjs/common';
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
  findOne(
    options: FindOneOptions<Entity>,
    throwError: boolean,
  ): Promise<Entity>;

  find(options: FindOptions<Entity>, throwError: boolean): Promise<Entity[]>;

  save(entities: Entity[]): Promise<Entity[]>;
  save(entity: Entity): Promise<Entity>;

  updateOne(
    optionsOrEntity: FindOneOptions<Entity> | Entity,
    toUpdate: DeepPartial<Entity>,
    throwError: boolean,
  ): Promise<Entity>;

  removeOne(
    optionsOrEntity: FindOneOptions<Entity> | Entity,
    throwError: boolean,
  ): Promise<void>;

  remove(
    optionsOrEntities: FindManyOptions<Entity> | Entity[],
    throwError: boolean,
  ): Promise<void>;

  formatToDto(entities: Entity[]): EntityDto[];
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

  async find(
    options: FindManyOptions<Entity>,
    throwError: boolean = false,
  ): Promise<Entity[]> {
    if (Object.values(options.where).includes(undefined)) {
      throw new Error('Properties in the options.where must be defined');
    }

    const entities: Entity[] = await this.entityRepository.find(options);

    if (!entities && throwError) {
      throw new NotFoundException();
    }

    return entities;
  }

  async findOne(
    options: FindOneOptions<Entity>,
    throwError: boolean = false,
  ): Promise<Entity> {
    if (Object.values(options.where).includes(undefined)) {
      throw new Error('Properties in the options.where must be defined');
    }

    const entity: Entity = await this.entityRepository.findOne(options);

    if (!entity && throwError) {
      throw new NotFoundException();
    }

    return entity;
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
    throwError: boolean = false,
  ): Promise<void> {
    const entities: Entity[] =
      'where' in <object>optionsOrEntities
        ? await this.entityRepository.find(
            optionsOrEntities as FindManyOptions<Entity>,
          )
        : (optionsOrEntities as Entity[]);

    if (!entities && throwError) {
      throw new NotFoundException();
    }

    await this.entityRepository.remove(entities);
  }

  async removeOne(
    optionsOrEntity: FindOneOptions<Entity> | Entity,
    throwError: boolean = false,
  ): Promise<void> {
    const entity: Entity =
      'where' in <object>optionsOrEntity
        ? await this.entityRepository.findOne(optionsOrEntity)
        : (optionsOrEntity as Entity);

    if (!entity && throwError) {
      throw new NotFoundException();
    }

    await this.entityRepository.remove(entity);
  }

  async updateOne(
    optionsOrEntity: FindOneOptions<Entity> | Entity,
    toUpdate: DeepPartial<Entity>,
    throwError: boolean = false,
  ): Promise<Entity> {
    const entity: Entity =
      'where' in <object>optionsOrEntity
        ? await this.entityRepository.findOne(optionsOrEntity)
        : (optionsOrEntity as Entity);

    if (!entity && throwError) {
      throw new NotFoundException();
    }

    this.entityRepository.merge(entity, toUpdate);

    return this.entityRepository.save(entity);
  }

  formatToDto(entities: Entity[]): EntityDto[];
  formatToDto(entity: Entity): EntityDto;
  formatToDto(entity: Entity | Entity[]): EntityDto | EntityDto[] {
    if (Array.isArray(entity)) {
      return entity.map((entity) => new this.entityDto(entity));
    } else {
      return new this.entityDto(entity);
    }
  }
}
