import React from 'react';

// This component is deprecated and has been replaced by TopicDropdown.tsx.
// It is intentionally left blank to prevent it from rendering.
// If you see a warning in your console about this component, it means something
// in the code is still trying to render it.
export function TopicList() {
  if (process.env.NODE_ENV === 'development') {
    console.warn('DEPRECATED: The <TopicList> component is being rendered. It should be fully replaced by <TopicDropdown>.');
  }
  return null;
}
