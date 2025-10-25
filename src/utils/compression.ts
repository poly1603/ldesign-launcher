/**
 * 压缩工具
 */

import zlib from 'zlib'
import { promisify } from 'util'

const gzip = promisify(zlib.gzip)
const gunzip = promisify(zlib.gunzip)

export async function compress(data: string): Promise<string> {
  const buffer = Buffer.from(data, 'utf-8')
  const compressed = await gzip(buffer)
  return compressed.toString('base64')
}

export async function decompress(data: string): Promise<string> {
  const buffer = Buffer.from(data, 'base64')
  const decompressed = await gunzip(buffer)
  return decompressed.toString('utf-8')
}




