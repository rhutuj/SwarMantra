import { ChangeEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react'
import {
  TaalConfig,
  getTaalConfig,
  getMatraInfo,
  notationStringToArray,
  notationArrayToString,
  notationStringToLines,
  notationLinesToString,
} from '../utils/taalConfig'
import {
  isSwarLetter,
  isModifierKey,
  isValidCombination,
  getUnicodeSwar,
  processSwarKey,
  beep,
  flashElement,
} from '../utils/swarInput'

interface NotationEditorProps {
  id?: string
  name?: string
  label?: string
  description?: string
  taal: string
  startingBeat: number
  value?: string
  onChange: (value: string) => void
  readOnly?: boolean
}

export default function NotationEditor({
  id,
  name,
  label = 'Notation',
  description,
  taal,
  startingBeat,
  value,
  onChange,
  readOnly = false,
}: NotationEditorProps) {
  const taalConfig = getTaalConfig(taal)
  const inputRefs = useRef<(HTMLInputElement | null)[][]>([])
  const [focusedCell, setFocusedCell] = useState<{ line: number; matra: number } | null>(null)
  const pendingModsRef = useRef<Set<string>>(new Set())
  const modTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const lines = taalConfig
    ? notationStringToLines(value || '', taalConfig.totalMatras)
    : []

  const clearModTimeout = useCallback(() => {
    if (modTimeoutRef.current) {
      clearTimeout(modTimeoutRef.current)
      modTimeoutRef.current = null
    }
  }, [])

  const resetModTimeout = useCallback(() => {
    clearModTimeout()
    modTimeoutRef.current = setTimeout(() => {
      pendingModsRef.current = new Set()
    }, 800)
  }, [clearModTimeout])

  const handleCellChange = useCallback(
    (lineIndex: number, matraIndex: number, newValue: string) => {
      if (!taalConfig) return
      const updatedLines = lines.map((line) => [...line])
      updatedLines[lineIndex][matraIndex] = newValue
      onChange(notationLinesToString(updatedLines))
    },
    [lines, onChange, taalConfig]
  )

  const insertSwarAtCursor = useCallback(
    (lineIndex: number, matraIndex: number, swarKey: string, mods: Set<string>) => {
      const input = inputRefs.current[lineIndex]?.[matraIndex]
      if (!input) return

      const currentValue = input.value
      const start = input.selectionStart || 0
      const end = input.selectionEnd || 0

      const { newValue, newCursor } = processSwarKey(currentValue, start, end, swarKey, mods)

      handleCellChange(lineIndex, matraIndex, newValue)

      // Restore cursor after re-render
      requestAnimationFrame(() => {
        const el = inputRefs.current[lineIndex]?.[matraIndex]
        if (el) {
          el.setSelectionRange(newCursor, newCursor)
        }
      })
    },
    [handleCellChange]
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>, lineIndex: number, matraIndex: number) => {
      if (!taalConfig || readOnly) return

      const key = e.key.toLowerCase()

      // Handle modifier keys (q, a, k, t)
      if (isModifierKey(key)) {
        e.preventDefault()

        const currentMods = pendingModsRef.current

        if (currentMods.has(key)) {
          // Duplicate modifier
          beep()
          const input = inputRefs.current[lineIndex]?.[matraIndex]
          if (input) flashElement(input)
          pendingModsRef.current = new Set()
          clearModTimeout()
          return
        }

        if ((key === 'q' && currentMods.has('a')) || (key === 'a' && currentMods.has('q'))) {
          // Conflicting saptaks
          beep()
          const input = inputRefs.current[lineIndex]?.[matraIndex]
          if (input) flashElement(input)
          pendingModsRef.current = new Set()
          clearModTimeout()
          return
        }

        const newMods = new Set(currentMods)
        newMods.add(key)
        pendingModsRef.current = newMods
        resetModTimeout()
        return
      }

      // Handle swar letters (s, r, g, m, p, d, n)
      if (isSwarLetter(key)) {
        e.preventDefault()

        const currentMods = pendingModsRef.current
        const input = inputRefs.current[lineIndex]?.[matraIndex]
        if (!input) return

        const validation = isValidCombination(key, currentMods)
        if (!validation.valid) {
          beep()
          flashElement(input)
          // Fall back to plain uppercase
          insertSwarAtCursor(lineIndex, matraIndex, key, new Set())
        } else {
          insertSwarAtCursor(lineIndex, matraIndex, key, currentMods)
        }

        pendingModsRef.current = new Set()
        clearModTimeout()
        return
      }

      // Clear modifiers on any non-swar, non-modifier key
      if (pendingModsRef.current.size > 0) {
        pendingModsRef.current = new Set()
        clearModTimeout()
      }

      // Existing Tab navigation
      if (e.key === 'Tab') {
        e.preventDefault()
        const totalMatras = taalConfig.totalMatras

        if (e.shiftKey) {
          if (matraIndex > 0) {
            inputRefs.current[lineIndex]?.[matraIndex - 1]?.focus()
          } else if (lineIndex > 0) {
            inputRefs.current[lineIndex - 1]?.[totalMatras - 1]?.focus()
          }
        } else {
          if (matraIndex < totalMatras - 1) {
            inputRefs.current[lineIndex]?.[matraIndex + 1]?.focus()
          } else if (lineIndex < lines.length - 1) {
            inputRefs.current[lineIndex + 1]?.[0]?.focus()
          }
        }
      }
    },
    [taalConfig, lines.length, readOnly, clearModTimeout, resetModTimeout, insertSwarAtCursor]
  )

  const handleFocus = useCallback((lineIndex: number, matraIndex: number) => {
    setFocusedCell({ line: lineIndex, matra: matraIndex })
  }, [])

  const handleBlur = useCallback(() => {
    setFocusedCell(null)
    pendingModsRef.current = new Set()
    clearModTimeout()
  }, [clearModTimeout])

  const addLine = useCallback(() => {
    if (!taalConfig) return
    const updatedLines = [...lines, Array(taalConfig.totalMatras).fill('')]
    onChange(notationLinesToString(updatedLines))
  }, [lines, onChange, taalConfig])

  const removeLine = useCallback(
    (lineIndex: number) => {
      if (!taalConfig || lines.length <= 1) return
      const updatedLines = lines.filter((_, i) => i !== lineIndex)
      onChange(notationLinesToString(updatedLines))
    },
    [lines, onChange, taalConfig]
  )

  useEffect(() => {
    if (!taalConfig) return
    inputRefs.current = lines.map((_, lineIndex) => {
      const existingLine = inputRefs.current[lineIndex] || []
      return Array(taalConfig.totalMatras).fill(null).map((_, matraIndex) => existingLine[matraIndex] || null)
    })
  }, [taalConfig, lines.length])

  useEffect(() => {
    return () => {
      clearModTimeout()
    }
  }, [clearModTimeout])

  if (!taalConfig) {
    return (
      <div>
        <label className="block text-sm font-medium text-slate-700">{label}</label>
        <p className="mt-1 text-sm text-red-600">
          Unknown taal &quot;{taal}&quot;. Please select a valid taal first.
        </p>
      </div>
    )
  }

  const renderTaalRow = (lineIndex: number, matras: string[]) => {
    return (
      <div key={lineIndex} className="flex items-start gap-1">
        {!readOnly && lines.length > 1 && (
          <button
            type="button"
            onClick={() => removeLine(lineIndex)}
            className="mt-8 flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-red-600"
            title="Remove line"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        <div
          className={`flex ${readOnly ? 'w-full' : ''}`}
          style={readOnly ? {} : { minWidth: taalConfig.totalMatras * 80 }}
        >
          {matras.map((notes, matraIndex) => {
            const info = getMatraInfo(taalConfig, matraIndex)
            const isFirstInVibhag = info.matraInVibhag === 0
            const isFirstLine = lineIndex === 0
            const isLastLine = lineIndex === lines.length - 1
            const isBeforeStart = isFirstLine && matraIndex < startingBeat - 1
            const isAfterEnd = isLastLine && matraIndex >= taalConfig.totalMatras - (startingBeat - 1)
            const isGreyed = isBeforeStart || isAfterEnd
            const isFocused = focusedCell?.line === lineIndex && focusedCell?.matra === matraIndex
            const noteCount = notes.trim() ? notes.trim().split(/\s+/).length : 0
            const isMarkerMatra = isFirstInVibhag && (info.type === 'sam' || info.type === 'khali')

            return (
              <div
                key={matraIndex}
                className="flex flex-col items-center"
                style={{
                  borderLeft: isFirstInVibhag && matraIndex > 0 ? '2px solid #334155' : undefined,
                  flex: readOnly ? '1 1 0' : undefined,
                }}
              >
                <div className="flex h-4 w-full items-center justify-center text-xs text-slate-400">
                  {matraIndex + 1}
                </div>

                <div
                  className={`flex h-4 w-full items-center justify-center text-xs font-bold ${
                    isFirstInVibhag
                      ? info.type === 'sam'
                        ? 'text-red-600'
                        : 'text-slate-900'
                      : ''
                  }`}
                >
                  {isFirstInVibhag ? info.marker : ''}
                </div>

                <div className="relative flex w-full flex-col items-center">
                  <input
                    ref={(el) => {
                      if (!inputRefs.current[lineIndex]) {
                        inputRefs.current[lineIndex] = []
                      }
                      inputRefs.current[lineIndex][matraIndex] = el
                    }}
                    id={lineIndex === 0 && matraIndex === 0 ? id : undefined}
                    name={lineIndex === 0 && matraIndex === 0 ? name : undefined}
                    type="text"
                    value={notes}
                    readOnly={readOnly || isGreyed}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleCellChange(lineIndex, matraIndex, e.target.value)
                    }
                    onKeyDown={(e) => handleKeyDown(e, lineIndex, matraIndex)}
                    onFocus={() => handleFocus(lineIndex, matraIndex)}
                    onBlur={handleBlur}
                    placeholder={isGreyed ? '' : '-'}
                    className={`w-full rounded border px-1 py-1 text-center font-mono text-sm ${
                      readOnly ? 'border-transparent bg-transparent text-slate-900' :
                      isGreyed
                        ? 'border-slate-200 bg-slate-100 text-slate-400'
                        : isFocused
                          ? 'border-slate-500 bg-white text-slate-900 ring-1 ring-slate-500'
                          : 'border-slate-300 bg-white text-slate-900'
                    } focus:outline-none`}
                    style={{ minWidth: readOnly ? 0 : 72 }}
                  />

                  {noteCount > 0 && (
                    <svg
                      className="mt-0.5"
                      width={readOnly ? '100%' : '72'}
                      height="10"
                      viewBox="0 0 72 10"
                      preserveAspectRatio="none"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d={`M 2 1 Q 36 ${noteCount > 1 ? 12 : 8} 70 1`}
                        stroke={isMarkerMatra && info.type === 'sam' ? '#dc2626' : '#334155'}
                        strokeWidth="1.5"
                        fill="none"
                      />
                    </svg>
                  )}
                  {noteCount === 0 && <div className="mt-2.5" />}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <label htmlFor={id} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
        {description ? <p className="text-xs text-slate-500">{description}</p> : null}
      </div>

      <div className={`mt-2 rounded-lg border border-slate-300 bg-white p-3 ${!readOnly ? 'overflow-x-auto' : ''}`}>
        <div className="space-y-3">
          {lines.map((matras, lineIndex) => renderTaalRow(lineIndex, matras))}
        </div>

        {!readOnly && (
          <button
            type="button"
            onClick={addLine}
            className="mt-3 flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Line
          </button>
        )}
      </div>

      {!readOnly && (
        <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="font-bold text-red-600">X</span> = Sam
          </span>
          <span className="flex items-center gap-1">
            <span className="font-bold text-slate-900">O</span> = Khali
          </span>
          <span>s=shudh q+swar=tar a+swar=mandra k+swar=komal t+swar=tivra</span>
          <span>Tab to navigate</span>
        </div>
      )}
    </div>
  )
}
