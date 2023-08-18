import { Permissions } from '@/permissions/permissions.constant';
import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsTypeOf(
  type: string | 'StringValue' | 'PermissionsAsStr',
  validationOptions?: ValidationOptions,
) {
  return function (object: NonNullable<unknown>, propertyName: string) {
    registerDecorator({
      name: 'IsType',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [type],
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (type === 'StringValue') {
            const units: Readonly<string[]> = [
              'years',
              'year',
              'yrs',
              'yr',
              'y',
              'weeks',
              'week',
              'w',
              'days',
              'day',
              'd',
              'hours',
              'hour',
              'hrs',
              'hr',
              'h',
              'minutes',
              'minute',
              'mins',
              'min',
              'm',
              'second',
              'secs',
              'sec',
              's',
              'milliseconds',
              'millisecond',
              'msecs',
              'msec',
              'ms',
            ];

            if (typeof value === 'string') {
              const parsedNumber = parseFloat(value);

              if (!parsedNumber) {
                return false;
              }

              const parsedUnit = value
                .slice(parsedNumber.toString().length)
                .toLowerCase();

              if (units.includes(parsedUnit)) {
                return true;
              }
            }
          } else if (type === 'PermissionsAsStr') {
            if (Array.isArray(value)) {
              return value.every((perm) => !!Permissions[perm]);
            } else return !!Permissions[value];
          }

          return typeof value === type;
        },

        defaultMessage(): string {
          return `${propertyName} must be a ${type}`;
        },
      },
    });
  };
}
