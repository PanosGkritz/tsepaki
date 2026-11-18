const euroFormatter = new Intl.NumberFormat('el-GR', {
  style: 'currency',
  currency: 'EUR',
});

export const formatEuro = (amount: number) => euroFormatter.format(amount);
