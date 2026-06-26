export interface Vibhag {
  matras: number
  marker: string
  type: 'sam' | 'khali' | 'normal'
}

export interface TaalConfig {
  name: string
  totalMatras: number
  vibhags: Vibhag[]
}

export const TAALS: Record<string, TaalConfig> = {
  Teentaal: {
    name: 'Teentaal',
    totalMatras: 16,
    vibhags: [
      { matras: 4, marker: 'X', type: 'sam' },
      { matras: 4, marker: '2', type: 'normal' },
      { matras: 4, marker: 'O', type: 'khali' },
      { matras: 4, marker: '4', type: 'normal' },
    ],
  },
  Jhaptaal: {
    name: 'Jhaptaal',
    totalMatras: 10,
    vibhags: [
      { matras: 2, marker: 'X', type: 'sam' },
      { matras: 3, marker: '2', type: 'normal' },
      { matras: 2, marker: 'O', type: 'khali' },
      { matras: 3, marker: '4', type: 'normal' },
    ],
  },
}

export function getTaalConfig(taalName: string): TaalConfig | null {
  return TAALS[taalName] || null
}

export interface MatraInfo {
  matraIndex: number
  matraNumber: number
  vibhagIndex: number
  matraInVibhag: number
  marker: string
  type: 'sam' | 'khali' | 'normal'
}

export function getMatraInfo(taal: TaalConfig, matraIndex: number): MatraInfo {
  let cumulativeMatras = 0
  for (let i = 0; i < taal.vibhags.length; i++) {
    const vibhag = taal.vibhags[i]
    if (matraIndex < cumulativeMatras + vibhag.matras) {
      const matraInVibhag = matraIndex - cumulativeMatras
      const isFirstInVibhag = matraInVibhag === 0
      return {
        matraIndex,
        matraNumber: matraIndex + 1,
        vibhagIndex: i,
        matraInVibhag,
        marker: isFirstInVibhag ? vibhag.marker : String(matraIndex + 1),
        type: vibhag.type,
      }
    }
    cumulativeMatras += vibhag.matras
  }
  return {
    matraIndex,
    matraNumber: matraIndex + 1,
    vibhagIndex: 0,
    matraInVibhag: 0,
    marker: String(matraIndex + 1),
    type: 'normal',
  }
}

export function getVibhagBoundaries(taal: TaalConfig): number[] {
  const boundaries: number[] = []
  let cumulative = 0
  for (const vibhag of taal.vibhags) {
    cumulative += vibhag.matras
    boundaries.push(cumulative)
  }
  return boundaries
}

export function notationStringToArray(notation: string, totalMatras: number): string[] {
  const parts = notation.split('|')
  const result: string[] = []
  for (let i = 0; i < totalMatras; i++) {
    result.push(parts[i] || '')
  }
  return result
}

export function notationArrayToString(matras: string[]): string {
  return matras.join('|')
}

export function notationStringToLines(notation: string, totalMatras: number): string[][] {
  if (!notation.trim()) {
    return [Array(totalMatras).fill('')]
  }
  const lineStrings = notation.split('\n')
  return lineStrings.map((lineStr) => {
    const parts = lineStr.split('|')
    const result: string[] = []
    for (let i = 0; i < totalMatras; i++) {
      result.push(parts[i] || '')
    }
    return result
  })
}

export function notationLinesToString(lines: string[][]): string {
  return lines.map((line) => line.join('|')).join('\n')
}


