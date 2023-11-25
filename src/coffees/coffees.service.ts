import { Injectable, NotFoundException } from '@nestjs/common';
import { Coffee } from './entities/coffee.entity';
import { CreateCoffeeDto } from './dto/create-coffee.dto';
import { UpdateCoffeeDtoTs } from './dto/update-coffee.dto';

@Injectable()
export class CoffeesService {
  private coffees: Coffee[] = [
    {
      id: 1,
      name: 'Shipwrek Roast',
      brand: 'Buddy Brew',
      flavors: ['chocolate', 'vanilla'],
    },
  ];

  findAll(): Coffee[] {
    return this.coffees;
  }

  findOne(id: string) {
    const coffee = this.coffees.find((item) => item.id === Number(id));

    if (!coffee) {
      throw new NotFoundException('Some test message');
    }

    return coffee;
  }

  create(createCoffeeDto: CreateCoffeeDto) {
    this.coffees.push({
      id: 9,
      ...createCoffeeDto,
    });
  }

  update(id: string, updateCoffeeDto: UpdateCoffeeDtoTs) {
    const exCoffee = this.findOne(id);
    if (exCoffee) {
      console.log(updateCoffeeDto);
    }
  }

  remove(id: string) {
    this.coffees = this.coffees.filter((coffee) => coffee.id !== Number(id));
  }
}
