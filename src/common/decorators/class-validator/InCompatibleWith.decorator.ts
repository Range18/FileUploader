import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function InCompatibleWith(
  properties: string[],
  validationOptions?: ValidationOptions,
) {
  return function (object: NonNullable<unknown>, propertyName: string) {
    registerDecorator({
      name: 'InCompatibleWith',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [properties],
      options: validationOptions,
      validator: {
        validate(
          value: any,
          validationArguments?: ValidationArguments,
        ): boolean {
          if (!(value == null && value == undefined)) {
            for (const property of properties) {
              if (
                !(
                  validationArguments.object[property] == null &&
                  validationArguments.object[property] == undefined
                )
              ) {
                return false;
              }
            }
          }
          return true;
        },
        defaultMessage(validationArguments?: ValidationArguments): string {
          return `Property ${propertyName} is inCompatible with ${validationArguments.constraints} `;
        },
      },
    });
  };
}
