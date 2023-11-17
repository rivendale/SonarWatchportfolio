export const comethAbi = [
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'borrowBalanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'address', name: '', type: 'address' },
    ],
    name: 'userCollateral',
    outputs: [
      { internalType: 'uint128', name: 'balance', type: 'uint128' },
      { internalType: 'uint128', name: '_reserved', type: 'uint128' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'numAssets',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint8', name: 'i', type: 'uint8' }],
    name: 'getAssetInfo',
    outputs: [
      {
        components: [
          { internalType: 'uint8', name: 'offset', type: 'uint8' },
          { internalType: 'address', name: 'asset', type: 'address' },
          { internalType: 'address', name: 'priceFeed', type: 'address' },
          { internalType: 'uint64', name: 'scale', type: 'uint64' },
          {
            internalType: 'uint64',
            name: 'borrowCollateralFactor',
            type: 'uint64',
          },
          {
            internalType: 'uint64',
            name: 'liquidateCollateralFactor',
            type: 'uint64',
          },
          { internalType: 'uint64', name: 'liquidationFactor', type: 'uint64' },
          { internalType: 'uint128', name: 'supplyCap', type: 'uint128' },
        ],
        internalType: 'struct CometCore.AssetInfo',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const compoundV2Abi = {
  // getAllMarkets: {
  //   constant: true,
  //   inputs: [],
  //   name: 'getAllMarkets',
  //   outputs: [
  //     { internalType: 'contract CToken[]', name: '', type: 'address[]' },
  //   ],
  //   payable: false,
  //   stateMutability: 'view',
  //   type: 'function',
  // },
  allMarkets: {
    constant: true,
    inputs: [{ internalType: 'uint256', name: 'index', type: 'uint256' }],
    name: 'allMarkets',
    outputs: [{ internalType: 'address', name: 'address', type: 'address' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  markets: {
    constant: true,
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'markets',
    outputs: [
      { internalType: 'bool', name: 'isListed', type: 'bool' },
      {
        internalType: 'uint256',
        name: 'collateralFactorMantissa',
        type: 'uint256',
      },
      { internalType: 'bool', name: 'isComped', type: 'bool' },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  underlying: {
    constant: true,
    inputs: [],
    name: 'underlying',
    outputs: [{ name: '', type: 'address' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  borrowBalanceStored: {
    constant: false,
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'borrowBalanceStored',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  exchangeRateStored: {
    constant: false,
    inputs: [],
    name: 'exchangeRateStored',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
} as const;
