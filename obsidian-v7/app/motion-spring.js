// Motion One generators v10.16.4, MIT. Type annotations removed; time helpers inlined.
const motionSpring = (()=>{
const defaults = {
  stiffness: 100.0,
  damping: 10.0,
  mass: 1.0,
}



const calcDampingRatio = (
  stiffness = defaults.stiffness,
  damping = defaults.damping,
  mass = defaults.mass
) => damping / (2 * Math.sqrt(stiffness * mass))

function hasReachedTarget(
  origin,
  target,
  current
) {
  return (
    (origin < target && current >= target) ||
    (origin > target && current <= target)
  )
}



const sampleT = 5 // ms
function calcGeneratorVelocity(
  resolveValue,
  t,
  current
) {
  const prevT = Math.max(t - sampleT, 0)
  return (current - resolveValue(prevT)) * 1000 / (t - prevT)
}
const spring = ({
  stiffness = defaults.stiffness,
  damping = defaults.damping,
  mass = defaults.mass,
  from = 0,
  to = 1,
  velocity = 0.0,
  restSpeed,
  restDistance,
} = {}) => {
  velocity = velocity ? velocity / 1000 : 0.0

  const state = {
    done: false,
    hasReachedTarget: false,
    current: from,
    target: to,
  }

  const initialDelta = to - from
  const undampedAngularFreq = Math.sqrt(stiffness / mass) / 1000
  const dampingRatio = calcDampingRatio(stiffness, damping, mass)

  const isGranularScale = Math.abs(initialDelta) < 5
  restSpeed = restSpeed || (isGranularScale ? 0.01 : 2)
  restDistance = restDistance || (isGranularScale ? 0.005 : 0.5)

  let resolveSpring

  if (dampingRatio < 1) {
    const angularFreq =
      undampedAngularFreq * Math.sqrt(1 - dampingRatio * dampingRatio)

    // Underdamped spring (bouncy)
    resolveSpring = (t) =>
      to -
      Math.exp(-dampingRatio * undampedAngularFreq * t) *
        (((-velocity + dampingRatio * undampedAngularFreq * initialDelta) /
          angularFreq) *
          Math.sin(angularFreq * t) +
          initialDelta * Math.cos(angularFreq * t))
  } else {
    // Critically damped spring
    resolveSpring = (t) => {
      return (
        to -
        Math.exp(-undampedAngularFreq * t) *
          (initialDelta + (-velocity + undampedAngularFreq * initialDelta) * t)
      )
    }
  }

  return (t) => {
    state.current = resolveSpring(t)

    const currentVelocity =
      t === 0
        ? velocity
        : calcGeneratorVelocity(resolveSpring, t, state.current)
    const isBelowVelocityThreshold = Math.abs(currentVelocity) <= restSpeed
    const isBelowDisplacementThreshold =
      Math.abs(to - state.current) <= restDistance
    state.done = isBelowVelocityThreshold && isBelowDisplacementThreshold
    state.hasReachedTarget = hasReachedTarget(from, to, state.current)

    return state
  }
}

return spring;
})();
