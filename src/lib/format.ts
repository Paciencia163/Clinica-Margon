export const formatAOA = (value: number | string | null | undefined) => {
  const n = Number(value ?? 0);
  try {
    return new Intl.NumberFormat("pt-AO", {
      style: "currency",
      currency: "AOA",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `Kz ${n.toLocaleString("pt-PT")}`;
  }
};
