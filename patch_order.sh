sed -i 's/  saveStoredData,/  saveStoredData,\n  getStoredMonth,\n  setStoredMonth,/' src/pages/Order.tsx
sed -i 's/const \[bulan, setBulan\] = useState("2026-06");/const [bulan, setBulanState] = useState(getStoredMonth());\n  const setBulan = (val: string) => {\n    setBulanState(val);\n    setStoredMonth(val);\n  };/' src/pages/Order.tsx
