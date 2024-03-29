export function parseNumber(str: string, precision: number) {
  if (str === "." || str === "") {
    return str;
  }
  const numberSegments = str.split(".");
  if (numberSegments.length !== 2) {
    return str;
  }
  const inputDecimals = numberSegments[1].length;
  const decimals = Math.min(inputDecimals, precision);
  const sanitizedValue = Number(
    (parseFloat(str) * 10 ** decimals) / 10 ** decimals
  ).toFixed(decimals);
  return sanitizedValue;
}

export const prettyFormatPrice = (price: number, decimals = 4): string => {
  return `$${(price >= 0.1
    ? price.toFixed(2)
    : price.toFixed(decimals)
  ).replace(/\d(?=(\d{3})+\.)/g, "$&,")}`;
};

export function msToTimeLeft(duration: number) {
  const minutes = Math.floor((duration / (1000 * 60)) % 60);
  const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
  const days = Math.floor(duration / (1000 * 60 * 60 * 24));
  return `${days}d ${hours}h ${minutes}m`;
}

export function convertUnixTimestamp(unixTimestamp: number): string {
  const date = new Date(unixTimestamp * 1000);
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const monthName = monthNames[date.getMonth()];
  const dayString = date.getDate().toString().padStart(2, "0");
  const yearString = date.getFullYear();
  return `${monthName} ${dayString} ${yearString}`;
}
