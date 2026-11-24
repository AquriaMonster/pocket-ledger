// Older embedded WebViews lack ES2022 Object.hasOwn used by the pinned engine.
if (!Object.hasOwn) Object.defineProperty(Object, 'hasOwn', { configurable: true, writable: true, value: (object, key) => Object.prototype.hasOwnProperty.call(object, key) });
