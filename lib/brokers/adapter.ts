/**
 * Interfaz común para integraciones de brokers.
 *
 * Ningún adapter concreto está implementado todavía (Fase 10). Cada nuevo
 * broker se añade implementando esta interfaz, sin tocar el resto del
 * sistema. La UI debe consultar `isImplemented` y mostrar
 * "Integración pendiente" cuando sea false, en vez de simular datos.
 */

export interface BrokerAccount {
  id: string;
  name: string;
  currency: string;
}

export interface BrokerPosition {
  ticker: string;
  isin?: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
}

export interface BrokerTransaction {
  id: string;
  type: "BUY" | "SELL" | "DIVIDEND" | "FEE";
  amount: number;
  date: string;
}

export interface BrokerBalance {
  currency: string;
  cash: number;
  invested: number;
}

export interface BrokerAdapter {
  readonly provider: string;
  readonly isImplemented: boolean;

  connect(authParams: Record<string, unknown>): Promise<{ connectionId: string }>;
  disconnect(connectionId: string): Promise<void>;
  getAccounts(connectionId: string): Promise<BrokerAccount[]>;
  getPositions(connectionId: string): Promise<BrokerPosition[]>;
  getTransactions(connectionId: string): Promise<BrokerTransaction[]>;
  getBalances(connectionId: string): Promise<BrokerBalance[]>;
}

/** Adapter base: lanza "Integración pendiente" en cada método hasta que se implemente. */
abstract class PendingBrokerAdapter implements BrokerAdapter {
  abstract readonly provider: string;
  readonly isImplemented = false;

  private pending(): never {
    throw new Error(`Integración pendiente: ${this.provider} todavía no está disponible.`);
  }

  connect(): Promise<{ connectionId: string }> {
    this.pending();
  }
  disconnect(): Promise<void> {
    this.pending();
  }
  getAccounts(): Promise<BrokerAccount[]> {
    this.pending();
  }
  getPositions(): Promise<BrokerPosition[]> {
    this.pending();
  }
  getTransactions(): Promise<BrokerTransaction[]> {
    this.pending();
  }
  getBalances(): Promise<BrokerBalance[]> {
    this.pending();
  }
}

export class InteractiveBrokersAdapter extends PendingBrokerAdapter {
  readonly provider = "INTERACTIVE_BROKERS";
}
export class TradeRepublicAdapter extends PendingBrokerAdapter {
  readonly provider = "TRADE_REPUBLIC";
}
export class DegiroAdapter extends PendingBrokerAdapter {
  readonly provider = "DEGIRO";
}
export class EtoroAdapter extends PendingBrokerAdapter {
  readonly provider = "ETORO";
}

export const BROKER_ADAPTER_REGISTRY: Record<string, BrokerAdapter> = {
  INTERACTIVE_BROKERS: new InteractiveBrokersAdapter(),
  TRADE_REPUBLIC: new TradeRepublicAdapter(),
  DEGIRO: new DegiroAdapter(),
  ETORO: new EtoroAdapter(),
};

export function getBrokerAdapter(provider: string): BrokerAdapter {
  const adapter = BROKER_ADAPTER_REGISTRY[provider];
  if (!adapter) throw new Error(`Broker desconocido: ${provider}`);
  return adapter;
}
