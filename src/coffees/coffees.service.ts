import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Coffee } from './entities/coffee.entity';
import { CreateCoffeeDto } from './dto/create-coffee.dto';
import { UpdateCoffeeDtoTs } from './dto/update-coffee.dto';
import { Flavor } from './entities/flavor.entity';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Event } from '../events/entities/event.entity';

@Injectable()
export class CoffeesService {
  constructor(
    @InjectRepository(Coffee)
    private readonly coffeeRepository: Repository<Coffee>,
    @InjectRepository(Flavor)
    private readonly flavorRepository: Repository<Flavor>,
    private dataSource: DataSource,
  ) {}

  async findAll(paginationQuery: PaginationQueryDto): Promise<Coffee[]> {
    return this.coffeeRepository.find({
      skip: paginationQuery.offset,
      take: paginationQuery.limit,
      relations: ['flavors'],
    });
  }

  async findOne(id: string): Promise<Coffee> {
    const coffee = await this.coffeeRepository.findOne({
      where: { id },
      relations: ['flavors'],
    });

    if (!coffee) {
      throw new NotFoundException('Some test message');
    }

    return coffee;
  }

  async create(createCoffeeDto: CreateCoffeeDto): Promise<Coffee> {
    const flavors = await Promise.all(
      createCoffeeDto.flavors.map((flavor) => this.preloadFlavorByName(flavor)),
    );
    const coffee = this.coffeeRepository.create({
      ...createCoffeeDto,
      flavors,
    });

    return this.coffeeRepository.save(coffee);
  }

  async update(
    id: string,
    updateCoffeeDto: UpdateCoffeeDtoTs,
  ): Promise<Coffee> {
    const flavors =
      updateCoffeeDto.flavors &&
      (await Promise.all(
        updateCoffeeDto.flavors.map((flavor) =>
          this.preloadFlavorByName(flavor),
        ),
      ));
    const coffee = await this.coffeeRepository.preload({
      id,
      ...updateCoffeeDto,
      flavors,
    });

    if (!coffee) {
      throw new NotFoundException();
    }

    return this.coffeeRepository.save(coffee);
  }

  async remove(id: string) {
    const coffee = await this.findOne(id);

    return this.coffeeRepository.remove(coffee);
  }

  private async recommendCoffee(coffee: Coffee) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      coffee.recommendations += 1;
      const recommendEvent = new Event();
      recommendEvent.name = 'TestEvent';
      recommendEvent.payload = { coffeeId: coffee.id };
      recommendEvent.type = 'TestType';
      await queryRunner.manager.save(coffee);
      await queryRunner.manager.save(recommendEvent);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  private async preloadFlavorByName(name: string): Promise<Flavor> {
    const existingFlavor = await this.flavorRepository.findOne({
      where: { name },
    });

    return existingFlavor
      ? existingFlavor
      : this.flavorRepository.create({ name });
  }
}
