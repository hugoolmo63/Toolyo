import QRCode from "qrcode";

export async function createTotpQr(uri: string): Promise<string> {
  return QRCode.toDataURL(uri, { errorCorrectionLevel: "M", margin: 2, width: 256 });
}