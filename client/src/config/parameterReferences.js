// Reference values are intentionally unconfigured until an applicable source is selected.
// Keep reference metadata separate from raw sensor readings.
export const parameterReferences = {
  temperature: { lower: null, upper: null, source: null, context: null },
  pH: { lower: null, upper: null, source: null, context: null },
  salinity: { lower: null, upper: null, source: null, context: null, unit: null },
  ammonia: { lower: null, upper: null, source: null, context: null, parameter: 'TAN-N' }
}

export function getReferenceLabel(key) {
  const reference = parameterReferences[key]
  const hasBoundary = Number.isFinite(reference?.lower) || Number.isFinite(reference?.upper)
  if (!reference?.source || !reference?.context || !hasBoundary || (key === 'salinity' && !reference.unit)) {
    return 'Reference range not configured.'
  }

  const lower = Number.isFinite(reference.lower) ? reference.lower : 'No lower boundary'
  const upper = Number.isFinite(reference.upper) ? reference.upper : 'No upper boundary'
  const unit = reference.unit ? ` ${reference.unit}` : ''
  return `${lower}–${upper}${unit} · ${reference.source} · ${reference.context}`
}

export function getReferenceStatus(key, value) {
  const reference = parameterReferences[key]
  const hasBoundary = Number.isFinite(reference?.lower) || Number.isFinite(reference?.upper)
  if (!reference?.source || !reference?.context || !hasBoundary || !Number.isFinite(value) || (key === 'salinity' && !reference.unit)) return null
  if (Number.isFinite(reference.lower) && value < reference.lower) return 'Below reference range'
  if (Number.isFinite(reference.upper) && value > reference.upper) return 'Above reference range'
  return 'Within reference range'
}
