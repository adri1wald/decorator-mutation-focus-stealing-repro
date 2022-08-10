import { useEffect, useRef } from 'react'
import katex from 'katex'
import 'katex/dist/katex.css'

export type KatexRendererProps = {
  inline: boolean
  equation: string
  onError: () => void
  onClick: (event: React.MouseEvent) => void
}

const KatexRenderer = (props: KatexRendererProps) => {
  const { inline, equation, onError, onClick } = props
  const katexElementRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const katexElement = katexElementRef.current
    if (katexElement !== null) {
      try {
        katex.render(equation, katexElement, {
          displayMode: !inline,
          output: 'html',
          strict: 'warn',
          throwOnError: true,
          trust: false
        })
      } catch {
        onError()
      }
    }
  }, [equation, inline, katexElementRef, onError])
  // We use spacers either side to ensure Android doesn't try and compose from the
  // inner text from Katex. There didn't seem to be any other way of making this work,
  // without having a physical space.
  return (
    <>
      <span style={{ display: 'none' }}>
        {' '}
      </span>
      <span
        role='button'
        tabIndex={-1}
        ref={katexElementRef}
        onClick={onClick}
      />
      <span style={{ display: 'none' }}>
        {' '}
      </span>
    </>
  )
}

export default KatexRenderer
