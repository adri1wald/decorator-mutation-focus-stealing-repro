import React, { useState, useCallback, useEffect } from 'react'
import {
  DecoratorNode, LexicalNode, SerializedLexicalNode,
  EditorConfig, Spread, NodeKey
} from 'lexical'
import { $getNodeByKey } from 'lexical'
import { createStyles, Skeleton } from '@mantine/core'
import { IconSuperscript, IconAlertCircle } from '@tabler/icons'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { EquationPopover } from './EquationPopover'

const KatexRenderer = React.lazy(() => import('./KatexRenderer'))

type StyleParams = {
  inline: boolean
  valid: boolean
}

const useStyles = createStyles((theme, params: StyleParams) => ({
  skeletonContainer: {
    verticalAlign: 'middle'
  },
  skeleton: {
    display: params.inline ? 'inline-block' : undefined,
    width: params.inline ? '200px' : '100%',
    height: params.inline ? '0.9em' : '43px',
    marginBlock: params.inline ? 0 : theme.spacing.xs
  },
  infoContainer: {
    display: params.inline ? 'inline-flex' : 'flex',
    verticalAlign: 'top',
    alignItems: 'center',
    cursor: 'pointer',
    borderRadius: theme.radius.sm,
    backgroundColor: params.valid 
      ? theme.colors[theme.primaryColor][0]
      : theme.colors.red[0],
    color: params.valid
      ? theme.colors[theme.primaryColor][6]
      : theme.colors.red[6],
    padding: params.inline ? '0 4px' : theme.spacing.xs,
    gap: '4px',
    marginBlock: params.inline ? 0 : theme.spacing.xs
  },

}))

type EquationComponentProps = {
  equation: string
  inline: boolean
  nodeKey: NodeKey
}

const EquationComponent = (props: EquationComponentProps) => {
  const { equation, inline, nodeKey } = props
  const [editor] = useLexicalComposerContext()
  const [virtualElement, setVirtualElement] = useState<HTMLElement | null>(null)
  const [newEquation, setNewEquation] = useState(equation)
  const [valid, setValid] = useState(true)
  const { classes } = useStyles({ inline, valid }) 
  
  const open = useCallback(() => {
    const node = editor.getElementByKey(nodeKey)
    if (!node) return
    setVirtualElement(node)
  }, [editor, nodeKey])

  const onError = useCallback(() => setValid(false), [])

  const save = (restoreSelection?: boolean) => {
    setVirtualElement(null)
    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if (!$isEquationNode(node)) return
      if (!newEquation.length) {
        if (restoreSelection) {
          node.selectNext(0, 0)
        }
        node.remove()
      } else {
        node.setEquation(newEquation)
        if (restoreSelection) {
          node.selectNext(0, 0)
        }
      }
    })
  }

  const discard = (restoreSelection?: boolean) => {
    setVirtualElement(null)
    setNewEquation(equation)
    if (restoreSelection || !equation) {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey)
        if (!$isEquationNode(node)) return
        if (restoreSelection) {
          node.selectNext(0, 0)
        }
        if (!equation) {
          node.remove()
        }
      })
    }
  }

  useEffect(() => {
    if (newEquation === '') {
      open()
    }
  }, [editor, nodeKey, newEquation, open])

  return (
    <>
      <EquationPopover
        virtualElement={virtualElement}
        inline={inline}
        equation={newEquation}
        setEquation={setNewEquation}
        setValid={setValid}
        save={save}
        discard={discard}
      />
      {newEquation.length ? (
        valid ? (
          <React.Suspense
            fallback={(
              <span className={classes.skeletonContainer}>
                <Skeleton className={classes.skeleton} />
              </span>
            )}
          >
            <KatexRenderer
              inline={inline}
              equation={newEquation}
              onClick={open}
              onError={onError}
            />
          </React.Suspense>
        ) : (
          <span
            role='button'
            tabIndex={-1}
            onClick={open}
            className={classes.infoContainer}
          >
            <IconAlertCircle size={18} />
            {`Invalid ${inline ? 'inline': 'block'} TeX equation`}
          </span>
        )
      ) : (
        <span
          role='button'
          tabIndex={-1}
          onClick={open}
          className={classes.infoContainer}
        >
          <IconSuperscript size={18} />
          {`Add ${inline ? 'an inline': 'a block'} TeX equation`}
        </span>
      )}
    </>
  )
}

export type SerializedEquationNode = Spread<
  {
    type: 'equation'
    equation: string
    inline: boolean
  },
  SerializedLexicalNode
>

export class EquationNode extends DecoratorNode<JSX.Element> {
  __equation: string
  __inline: boolean

  static getType(): string {
    return 'equation'
  }

  static clone(node: EquationNode): EquationNode {
    return new EquationNode(node.__equation, node.__inline, node.__key)
  }

  constructor(equation: string, inline?: boolean, key?: NodeKey) {
    super(key)
    this.__equation = equation
    this.__inline = inline ?? false
  }

  static importJSON(serializedNode: SerializedEquationNode): EquationNode {
    const node = $createEquationNode(
      serializedNode.equation,
      serializedNode.inline,
    )
    return node
  }

  exportJSON(): SerializedEquationNode {
    return {
      equation: this.getEquation(),
      inline: this.__inline,
      type: 'equation',
      version: 1,
    }
  }

  createDOM(_config: EditorConfig): HTMLElement {
    return document.createElement(this.__inline ? 'span' : 'div')
  }

  updateDOM(prevNode: EquationNode): boolean {
    // If the inline property changes, replace the element
    return this.__inline !== prevNode.__inline
  }

  getEquation(): string {
    return this.__equation
  }

  setEquation(equation: string): void {
    const writable = this.getWritable()
    writable.__equation = equation
  }

  decorate(): JSX.Element {
    return (
      <EquationComponent
        equation={this.__equation}
        inline={this.__inline}
        nodeKey={this.__key}
      />
    )
  }
}

export function $createEquationNode(
  equation = '',
  inline = false,
): EquationNode {
  const equationNode = new EquationNode(equation, inline)
  return equationNode
}

export function $isEquationNode(
  node: LexicalNode | null | undefined,
): node is EquationNode {
  return node instanceof EquationNode
}
