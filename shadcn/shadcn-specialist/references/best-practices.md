# shadcn/ui Best Practices

## Core Principles

### 1. Copy-Paste Philosophy
shadcn/ui is not a traditional component library. Components are copied into the project, giving full control over the code.

**Best Practice:**
- Copy components into `components/ui/` directory
- Modify components as needed for specific use cases
- Keep the original shadcn/ui structure for maintainability
- Document any significant modifications

### 2. Composition Over Configuration
Build complex components by composing simpler ones rather than adding configuration props.

**Good:**
```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>
```

**Avoid:**
```tsx
<Dialog
  trigger={<Button>Open Dialog</Button>}
  title="Title"
  description="Description"
/>
```

### 3. Accessibility First
All shadcn/ui components are built with Radix UI primitives, which provide excellent accessibility out of the box.

**Best Practice:**
- Always include proper ARIA labels
- Maintain keyboard navigation
- Ensure focus management is correct
- Test with screen readers
- Use semantic HTML elements

## Form Handling

### React Hook Form + Zod Integration

shadcn/ui provides a `Form` component that integrates seamlessly with React Hook Form and Zod.

**Pattern:**
```tsx
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
})

function ProfileForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="shadcn" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

**Best Practices:**
- Define schema with Zod for type safety and validation
- Use `FormField` for each form field to connect React Hook Form
- Include `FormMessage` for error display
- Add `FormDescription` for helpful context
- Use `form.handleSubmit` for submission
- Infer TypeScript types from Zod schema with `z.infer`

### Controlled vs Uncontrolled Components

**Best Practice:** Use controlled components with React Hook Form for consistent state management.

```tsx
<FormField
  control={form.control}
  name="fieldName"
  render={({ field }) => (
    <FormItem>
      <FormControl>
        <Input {...field} />
      </FormControl>
    </FormItem>
  )}
/>
```

## Styling and Customization

### Tailwind CSS Integration

shadcn/ui components use Tailwind CSS for styling.

**Best Practices:**
- Use Tailwind utility classes for styling
- Leverage the `cn()` utility for conditional classes
- Follow Tailwind conventions for responsive design
- Use CSS variables for theme customization

**cn() Utility Pattern:**
```tsx
import { cn } from "@/lib/utils"

<Button className={cn("default-classes", isActive && "active-classes")}>
  Click me
</Button>
```

### CSS Variables for Theming

shadcn/ui uses CSS variables for theme colors.

**Structure:**
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  /* ... */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222.2 47.4% 11.2%;
  /* ... */
}
```

**Best Practice:**
- Modify CSS variables in `globals.css` for theme customization
- Use HSL color format for better color manipulation
- Maintain consistent color semantics across light/dark modes
- Test both themes thoroughly

### Component Variants

Use `class-variance-authority` (cva) for creating component variants.

**Pattern:**
```tsx
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ButtonProps extends VariantProps<typeof buttonVariants> {
  // ...
}
```

## State Management

### Dialog/Sheet State

**Best Practice:** Control dialog state externally when needed.

```tsx
const [open, setOpen] = useState(false)

<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    {/* Content */}
  </DialogContent>
</Dialog>
```

### Toast Notifications

Use the toast hook for notifications.

**Pattern:**
```tsx
import { useToast } from "@/components/ui/use-toast"

function Component() {
  const { toast } = useToast()

  return (
    <Button
      onClick={() => {
        toast({
          title: "Scheduled: Catch up",
          description: "Friday, February 10, 2023 at 5:57 PM",
        })
      }}
    >
      Show Toast
    </Button>
  )
}
```

## TypeScript Best Practices

### Type-Safe Forms

**Always infer types from Zod schemas:**
```tsx
const formSchema = z.object({
  email: z.string().email(),
  age: z.number().min(18),
})

type FormValues = z.infer<typeof formSchema>

const form = useForm<FormValues>({
  resolver: zodResolver(formSchema),
})
```

### Component Props

**Extend HTML element types:**
```tsx
interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}
```

### Ref Forwarding

**Use React.forwardRef for components that need refs:**
```tsx
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
```

## Common Patterns

### Async Button Actions

**Handle loading states properly:**
```tsx
function SubmitButton() {
  const [isLoading, setIsLoading] = useState(false)

  async function handleClick() {
    setIsLoading(true)
    try {
      await someAsyncAction()
      toast({ title: "Success" })
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleClick} disabled={isLoading}>
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Submit
    </Button>
  )
}
```

### Data Table with Filtering

**Use TanStack Table (React Table) with shadcn/ui:**
```tsx
import { useReactTable, getCoreRowModel } from "@tanstack/react-table"

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  // Add other table features as needed
})
```

### Command Palette

**Implement keyboard shortcuts:**
```tsx
useEffect(() => {
  const down = (e: KeyboardEvent) => {
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      setOpen((open) => !open)
    }
  }
  document.addEventListener("keydown", down)
  return () => document.removeEventListener("keydown", down)
}, [])
```

## Common Anti-Patterns to Avoid

### ❌ Over-Engineering Components

**Don't:**
```tsx
<Form
  fields={[
    { name: "email", type: "email", validation: emailSchema },
    { name: "password", type: "password", validation: passwordSchema },
  ]}
  onSubmit={handleSubmit}
/>
```

**Do:**
```tsx
<Form {...form}>
  <FormField name="email" control={form.control} render={...} />
  <FormField name="password" control={form.control} render={...} />
</Form>
```

### ❌ Ignoring Accessibility

**Don't:**
```tsx
<div onClick={handleClick}>Click me</div>
```

**Do:**
```tsx
<Button onClick={handleClick}>Click me</Button>
```

### ❌ Hardcoding Colors

**Don't:**
```tsx
<div className="bg-blue-500 text-white">Content</div>
```

**Do:**
```tsx
<div className="bg-primary text-primary-foreground">Content</div>
```

### ❌ Not Using the Form Component

**Don't:**
```tsx
<form>
  <input name="email" />
  {errors.email && <span>{errors.email}</span>}
</form>
```

**Do:**
```tsx
<Form {...form}>
  <FormField name="email" control={form.control} render={...} />
</Form>
```

## Performance Considerations

### Lazy Loading Components

**Use dynamic imports for large components:**
```tsx
import dynamic from 'next/dynamic'

const DataTable = dynamic(() => import('@/components/ui/data-table'), {
  loading: () => <Skeleton />,
})
```

### Memoization

**Memoize expensive calculations:**
```tsx
const sortedData = useMemo(() => {
  return data.sort((a, b) => a.value - b.value)
}, [data])
```

### Debouncing Search Inputs

**Use debounce for search/filter inputs:**
```tsx
import { useDebouncedCallback } from 'use-debounce'

const handleSearch = useDebouncedCallback((value: string) => {
  setSearchQuery(value)
}, 300)
```

## Testing

### Unit Testing Components

**Test user interactions:**
```tsx
import { render, screen, fireEvent } from '@testing-library/react'

test('button click shows dialog', () => {
  render(<DialogComponent />)
  fireEvent.click(screen.getByRole('button'))
  expect(screen.getByRole('dialog')).toBeInTheDocument()
})
```

### Form Validation Testing

**Test validation logic:**
```tsx
test('shows error for invalid email', async () => {
  render(<FormComponent />)
  const input = screen.getByLabelText('Email')
  fireEvent.change(input, { target: { value: 'invalid' } })
  fireEvent.submit(screen.getByRole('button'))
  expect(await screen.findByText(/valid email/i)).toBeInTheDocument()
})
```
