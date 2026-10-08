// Deliberately fixed to this host and its requested local subnet; never bind a wildcard.
export const LAN_BIND_ADDRESS = '192.168.222.10';

export function isLanRequestAllowed(request) {
  const remoteAddress = request.socket?.remoteAddress;
  if (typeof remoteAddress !== 'string') return false;
  // Node can represent an IPv4 peer with the IPv4-mapped IPv6 prefix.
  const address = remoteAddress.replace(/^::ffff:/i, '');
  const match = /^192\.168\.222\.(0|[1-9]\d{0,2})$/.exec(address);
  return match !== null && Number(match[1]) <= 255;
}
