import { KeyboardEvent, ChangeEvent, useCallback } from 'react'
import { TextInput, Textarea, createStyles, Popper, Paper, Button } from '@mantine/core'
import { useClickOutside } from '@mantine/hooks'

type StyleParams = {
  inline: boolean
}

const useStyles = createStyles((theme, params: StyleParams) => ({
  root: {
    display: 'flex',
    flexDirection: params.inline ? 'row' : 'column',
    alignItems: params.inline ? 'center' : 'flex-start',
    pointerEvents: 'all',
    backgroundColor: theme.colorScheme === 'dark'
      ? theme.colors.dark[6]
      : theme.white,
    padding: 4,
    gap: 4
  }
}))

type EquationPopoverProps = {
  virtualElement: HTMLElement | null
  inline: boolean
  equation: string
  setEquation: (equation: string) => void
  setValid: (valid: boolean) => void
  save: (restoreSelection?: boolean) => void
  discard: (restoreSelection?: boolean) => void
}

export const EquationPopover = (props: EquationPopoverProps) => {
  const {
    virtualElement, inline, equation,
    setEquation, setValid, save, discard
  } = props

  const { classes } = useStyles({ inline })
  
  const ref = useClickOutside(() => discard(false))

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      discard(true)
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      save(true)
    }
  }

  const handleSubmit = () => save(true)
 
  const handleChange = useCallback((event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setValid(true)
    setEquation(event.target.value)
  }, [setValid, setEquation])

  return (
    <Popper
      position='bottom'
      placement={inline ? 'start' : 'center'}
      mounted={!!virtualElement}
      referenceElement={virtualElement as HTMLElement}
      zIndex={200}
    >
      <Paper
        ref={ref}
        className={classes.root}
        shadow='md'
        role='menu'
        radius='sm'
        aria-orientation='vertical'
      >
        {inline ? (
          <TextInput
            autoFocus
            size='sm'
            radius='sm'
            value={equation}
            onKeyDown={handleKeyDown}
            onChange={handleChange}
            placeholder='Enter your equation'
          />
        ) : (
          <Textarea
            autoFocus
            size='sm'
            radius='sm'
            value={equation}
            onKeyDown={handleKeyDown}
            onChange={handleChange}
            autosize
            maxRows={5}
            placeholder='Enter your equation'
          />
        )}
        <Button
          radius='sm'
          size='sm'
          onClick={handleSubmit}
          disabled={!equation.length}
        >
          Save
        </Button>
      </Paper>
    </Popper>
  ) 
}
