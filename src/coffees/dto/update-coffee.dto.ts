import { PartialType } from '@nestjs/swagger';

import { CreateCoffeeDto } from './create-coffee.dto';

export class UpdateCoffeeDtoTs extends PartialType(CreateCoffeeDto) {}
