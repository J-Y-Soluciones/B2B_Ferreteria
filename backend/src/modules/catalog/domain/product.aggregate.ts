import { Money } from "../../../shared/domain/value-objects/money.vo.js";
import { Quantity } from "../../../shared/domain/value-objects/quantity.vo.js";
import { DomainValidationError } from "../../../core/errors/domain.error.js";

export interface ProductConversionProps {
  id: string;
  presentationName: string;
  barcode: string | null;
  conversionRate: number; // e.g. 0.9463 para cuarto de galón frente a litro
  salePrice: Money;
  isActive: boolean;
}

export interface ProductProps {
  id: string;
  tenantId: string;
  categoryId: string | null;
  sku: string | null;
  barcode: string | null;
  name: string;
  baseUnit: string;
  costPrice: Money;
  baseSalePrice: Money;
  isService: boolean;
  isActive: boolean;
  conversions: ProductConversionProps[];
}

export class Product {
  private constructor(private readonly props: ProductProps) {
    Object.freeze(this);
  }

  public static rehydrate(props: ProductProps): Product {
    return new Product(props);
  }

  public get id(): string {
    return this.props.id;
  }
  public get tenantId(): string {
    return this.props.tenantId;
  }
  public get name(): string {
    return this.props.name;
  }
  public get baseUnit(): string {
    return this.props.baseUnit;
  }
  public get isService(): boolean {
    return this.props.isService;
  }
  public get baseSalePrice(): Money {
    return this.props.baseSalePrice;
  }
  public get conversions(): readonly ProductConversionProps[] {
    return this.props.conversions;
  }

  public calculateBaseDeduction(
    quantity: Quantity,
    conversionId?: string | null,
  ): Quantity {
    if (this.props.isService) {
      return Quantity.zero();
    }
    if (!conversionId) {
      return quantity;
    }
    const conv = this.props.conversions.find(
      (c) => c.id === conversionId && c.isActive,
    );
    if (!conv) {
      throw new DomainValidationError(
        `Presentación con ID ${conversionId} no encontrada o inactiva.`,
      );
    }
    return quantity.multiply(conv.conversionRate);
  }
}
