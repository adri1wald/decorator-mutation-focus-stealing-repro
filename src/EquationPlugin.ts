import { useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {LexicalCommand, TextNode} from 'lexical'
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand
} from 'lexical'
import type { TextMatchTransformer } from '@lexical/markdown'
import { EquationNode, $createEquationNode, $isEquationNode } from './EquationNode'
import { mergeRegister } from '@lexical/utils'

type CommandPayload = {
  equation: string
  inline: boolean
}

export const INSERT_EQUATION_COMMAND: LexicalCommand<CommandPayload> = createCommand()

export const EQUATION_TRANSFORMER: TextMatchTransformer = {
  export: (node) => {
    if (!$isEquationNode(node)) {
      return null
    }

    return `$${node.getEquation()}$`
  },
  importRegExp: /\$([^$].+?)\$/,
  regExp: /\$([^$].+?)\$$/,
  replace: (textNode, match) => {
    const [, equation] = match;
    const equationNode = $createEquationNode(equation, true);
    textNode.replace(equationNode)
  },
  trigger: '$',
  type: 'text-match'
}

export const EquationPlugin = () => {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!editor.hasNodes([EquationNode])) {
      throw new Error('EquationsPlugins: EquationsNode not registered on editor')
    }

    return mergeRegister(
      editor.registerCommand(
        INSERT_EQUATION_COMMAND,
        (payload) => {
          const { equation, inline } = payload
          const selection = $getSelection()

          if ($isRangeSelection(selection)) {
            const equationNode = $createEquationNode(equation, inline)
            selection.insertNodes([equationNode])
          }

          return true
        },
        COMMAND_PRIORITY_EDITOR
      ),
      editor.registerNodeTransform(TextNode, (node) => {
        if (node.getTextContent() === 'equation') {
          const equationNode = $createEquationNode('', false)
          node.replace(equationNode)
        }
      })
    )
  }, [editor])

  return null
}
