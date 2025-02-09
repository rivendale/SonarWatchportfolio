import { PublicKey, AccountInfo } from '@solana/web3.js';
import {
  AccountType,
  Base,
  CorpAction,
  Ema,
  MappingData,
  PermissionData,
  Price,
  PriceComponent,
  PriceData,
  PriceStatus,
  PriceType,
} from './structs';
import { readBigInt64LE, readBigUInt64LE } from './readBig';

export const Magic = 0xa1b2c3d4;
export const Version2 = 2;
export const Version = Version2;
/** Number of slots that can pass before a publisher's price is no longer included in the aggregate. */
export const MAX_SLOT_DIFFERENCE = 25;

const empty32Buffer = Buffer.alloc(32);
const PKorNull = (data: Buffer) =>
  data.equals(empty32Buffer) ? null : new PublicKey(data);

export function parseBaseData(data: Buffer): Base | undefined {
  // data is too short to have the magic number.
  if (data.byteLength < 4) {
    return undefined;
  }

  const magic = data.readUInt32LE(0);
  if (magic === Magic) {
    // program version
    const version = data.readUInt32LE(4);
    // account type
    const type: AccountType = data.readUInt32LE(8);
    // account used size
    const size = data.readUInt32LE(12);
    return { magic, version, type, size };
  }
  return undefined;
}

export const parseMappingData = (data: Buffer): MappingData => {
  // pyth magic number
  const magic = data.readUInt32LE(0);
  // program version
  const version = data.readUInt32LE(4);
  // account type
  const type = data.readUInt32LE(8);
  // account used size
  const size = data.readUInt32LE(12);
  // number of product accounts
  const numProducts = data.readUInt32LE(16);
  // unused
  // const unused = accountInfo.data.readUInt32LE(20)
  // next mapping account (if any)
  const nextMappingAccount = PKorNull(data.slice(24, 56));
  // read each symbol account
  let offset = 56;
  const productAccountKeys: PublicKey[] = [];
  for (let i = 0; i < numProducts; i++) {
    const productAccountBytes = data.slice(offset, offset + 32);
    const productAccountKey = new PublicKey(productAccountBytes);
    offset += 32;
    productAccountKeys.push(productAccountKey);
  }
  return {
    magic,
    version,
    type,
    size,
    nextMappingAccount,
    productAccountKeys,
  };
};

const parsePriceInfo = (data: Buffer, exponent: number): Price => {
  // aggregate price
  const priceComponent = readBigInt64LE(data, 0);
  const price = Number(priceComponent) * 10 ** exponent;
  // aggregate confidence
  const confidenceComponent = readBigUInt64LE(data, 8);
  const confidence = Number(confidenceComponent) * 10 ** exponent;
  // aggregate status
  const status: PriceStatus = data.readUInt32LE(16);
  // aggregate corporate action
  const corporateAction: CorpAction = data.readUInt32LE(20);
  // aggregate publish slot. It is converted to number to be consistent with Solana's library interface (Slot there is number)
  const publishSlot = Number(readBigUInt64LE(data, 24));
  return {
    priceComponent,
    price,
    confidenceComponent,
    confidence,
    status,
    corporateAction,
    publishSlot,
  };
};

const parseEma = (data: Buffer, exponent: number): Ema => {
  // current value of ema
  const valueComponent = readBigInt64LE(data, 0);
  const value = Number(valueComponent) * 10 ** exponent;
  // numerator state for next update
  const numerator = readBigInt64LE(data, 8);
  // denominator state for next update
  const denominator = readBigInt64LE(data, 16);
  return { valueComponent, value, numerator, denominator };
};

// Provide currentSlot when available to allow status to consider the case when price goes stale. It is optional because
// it requires an extra request to get it when it is not available which is not always efficient.
export const parsePriceData = (
  data: Buffer,
  currentSlot?: number
): PriceData => {
  // pyth magic number
  const magic = data.readUInt32LE(0);
  // program version
  const version = data.readUInt32LE(4);
  // account type
  const type = data.readUInt32LE(8);
  // price account size
  const size = data.readUInt32LE(12);
  // price or calculation type
  const priceType: PriceType = data.readUInt32LE(16);
  // price exponent
  const exponent = data.readInt32LE(20);
  // number of component prices
  const numComponentPrices = data.readUInt32LE(24);
  // number of quoters that make up aggregate
  const numQuoters = data.readUInt32LE(28);
  // slot of last valid (not unknown) aggregate price
  const lastSlot = readBigUInt64LE(data, 32);
  // valid on-chain slot of aggregate price
  const validSlot = readBigUInt64LE(data, 40);
  // exponential moving average price
  const emaPrice = parseEma(data.slice(48, 72), exponent);
  // exponential moving average confidence interval
  const emaConfidence = parseEma(data.slice(72, 96), exponent);
  // timestamp of the current price
  const timestamp = readBigInt64LE(data, 96);
  // minimum number of publishers for status to be TRADING
  const minPublishers = data.readUInt8(104);
  // space for future derived values
  const drv2 = data.readInt8(105);
  // space for future derived values
  const drv3 = data.readInt16LE(106);
  // space for future derived values
  const drv4 = data.readInt32LE(108);
  // product id / reference account
  const productAccountKey = new PublicKey(data.slice(112, 144));
  // next price account in list
  const nextPriceAccountKey = PKorNull(data.slice(144, 176));
  // valid slot of previous update
  const previousSlot = readBigUInt64LE(data, 176);
  // aggregate price of previous update
  const previousPriceComponent = readBigInt64LE(data, 184);
  const previousPrice = Number(previousPriceComponent) * 10 ** exponent;
  // confidence interval of previous update
  const previousConfidenceComponent = readBigUInt64LE(data, 192);
  const previousConfidence =
    Number(previousConfidenceComponent) * 10 ** exponent;
  // space for future derived values
  const previousTimestamp = readBigInt64LE(data, 200);
  const aggregate = parsePriceInfo(data.slice(208, 240), exponent);

  let { status } = aggregate;

  if (currentSlot && status === PriceStatus.Trading) {
    if (currentSlot - aggregate.publishSlot > MAX_SLOT_DIFFERENCE) {
      status = PriceStatus.Unknown;
    }
  }

  let price;
  let confidence;
  if (status === PriceStatus.Trading) {
    price = aggregate.price;
    confidence = aggregate.confidence;
  }

  // price components - up to 32
  const priceComponents: PriceComponent[] = [];
  let offset = 240;
  while (priceComponents.length < numComponentPrices) {
    const publisher = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;
    const componentAggregate = parsePriceInfo(
      data.slice(offset, offset + 32),
      exponent
    );
    offset += 32;
    const latest = parsePriceInfo(data.slice(offset, offset + 32), exponent);
    offset += 32;
    priceComponents.push({ publisher, aggregate: componentAggregate, latest });
  }

  return {
    magic,
    version,
    type,
    size,
    priceType,
    exponent,
    numComponentPrices,
    numQuoters,
    lastSlot,
    validSlot,
    emaPrice,
    emaConfidence,
    timestamp,
    minPublishers,
    drv2,
    drv3,
    drv4,
    productAccountKey,
    nextPriceAccountKey,
    previousSlot,
    previousPriceComponent,
    previousPrice,
    previousConfidenceComponent,
    previousConfidence,
    previousTimestamp,
    aggregate,
    priceComponents,
    price,
    confidence,
    status,
  };
};

export const parsePermissionData = (data: Buffer): PermissionData => {
  // pyth magic number
  const magic = data.readUInt32LE(0);
  // program version
  const version = data.readUInt32LE(4);
  // account type
  const type = data.readUInt32LE(8);
  // price account size
  const size = data.readUInt32LE(12);
  const masterAuthority = new PublicKey(data.slice(16, 48));
  const dataCurationAuthority = new PublicKey(data.slice(48, 80));
  const securityAuthority = new PublicKey(data.slice(80, 112));
  return {
    magic,
    version,
    type,
    size,
    masterAuthority,
    dataCurationAuthority,
    securityAuthority,
  };
};

export function getPythPricesDatasMap(
  pubkeys: PublicKey[],
  accounts: (AccountInfo<Buffer> | null)[]
): Map<string, PriceData> {
  const pricesDatas = accounts.map((account) =>
    account ? parsePriceData(account.data) : undefined
  );
  const priceMap: Map<string, PriceData> = new Map();
  pricesDatas.forEach((prices, index) =>
    prices ? priceMap.set(pubkeys[index].toString(), prices) : undefined
  );
  return priceMap;
}

export function getPythPrice(
  pubkeys: PublicKey,
  account: AccountInfo<Buffer> | null
): PriceData | undefined {
  return account ? parsePriceData(account.data) : undefined;
}
