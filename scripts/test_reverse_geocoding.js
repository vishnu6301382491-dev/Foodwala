async function rev() {
  const lat = 12.92158;
  const lon = 77.61370;
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
  const res = await fetch(url, { headers: { 'User-Agent': 'FoodWala-BengaluruApp/1.0' } });
  const data = await res.json();
  console.log('Address:', data.address);
}
rev();
