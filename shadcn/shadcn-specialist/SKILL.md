---
name: shadcn-specialist
description: Comprehensive shadcn/ui implementation specialist. Use when implementing shadcn/ui components, reviewing shadcn/ui code for best practices, customizing themes, or building forms with React Hook Form + Zod. Applies to requests like "implement a form with shadcn/ui", "review this component", "customize the theme", "create a data table", or any shadcn/ui related development task. Provides battle-tested templates, patterns, and best practices for professional-grade shadcn/ui implementations.
---

# shadcn/ui Implementation Specialist

Specialized skill for implementing, reviewing, and customizing shadcn/ui components with best practices. Provides comprehensive templates, patterns, and guidelines for professional shadcn/ui development.

## Table of Contents
- [Overview](#overview)
- [Quick Start](#quick-start)
  - [When to Use This Skill](#when-to-use-this-skill)
  - [Core Principles](#core-principles)
- [Implementing Components](#implementing-components)
  - [Forms with React Hook Form + Zod](#forms-with-react-hook-form--zod)
  - [Data Tables](#data-tables)
  - [Dialogs and Modals](#dialogs-and-modals)
  - [Layouts](#layouts)
  - [Authentication Forms](#authentication-forms)
- [Reviewing Components](#reviewing-components)
  - [Review Checklist](#review-checklist)
  - [Reference Best Practices](#reference-best-practices)
  - [Common Issues to Flag](#common-issues-to-flag)
- [Customizing Themes](#customizing-themes)
  - [CSS Variables Approach](#css-variables-approach)
  - [Theme Provider Setup](#theme-provider-setup)
  - [Popular Color Schemes](#popular-color-schemes)
- [Using Templates](#using-templates)
  - [Template Structure](#template-structure)
  - [How to Use Templates](#how-to-use-templates)
  - [Utility Templates](#utility-templates)
- [Best Practices Reference](#best-practices-reference)
- [Component Patterns Reference](#component-patterns-reference)
- [Implementation Workflow](#implementation-workflow)
  - [For New Component Requests](#for-new-component-requests)
  - [For Review Requests](#for-review-requests)
  - [For Theme Customization](#for-theme-customization)
- [Quality Assurance Process](#quality-assurance-process)
- [Troubleshooting](#troubleshooting)
- [Resources Summary](#resources-summary)
- [Key Reminders](#key-reminders)

## Overview

This skill provides expert guidance for working with shadcn/ui, the popular React component library built on Radix UI and Tailwind CSS. It covers:

- **Component Implementation**: Build forms, data tables, dialogs, and complex layouts
- **Code Review**: Review existing implementations against shadcn/ui best practices
- **Theme Customization**: Customize colors, typography, and styling
- **Template Library**: Access production-ready templates for common patterns
- **Best Practices**: Follow proven patterns for TypeScript, accessibility, and performance

## Quick Start

### When to Use This Skill

Trigger this skill for:
- "Implement a form using shadcn/ui"
- "Review this shadcn component for best practices"
- "Customize the shadcn/ui theme"
- "Create a data table with shadcn/ui"
- "Build a dashboard layout with shadcn"
- "Add dark mode to my shadcn project"

### Core Principles

Follow these shadcn/ui principles:

1. **Copy-Paste Philosophy**: Components are copied into the project for full control
2. **Composition Over Configuration**: Build complex components by composing simpler ones
3. **Accessibility First**: All components built on Radix UI with excellent a11y
4. **Tailwind CSS**: Use utility classes and CSS variables for styling
5. **Type Safety**: Leverage TypeScript with Zod for validation

## Implementing Components

### Forms with React Hook Form + Zod

For form implementation requests:

1. **Define Zod schema** for type safety and validation
2. **Use Form component** with React Hook Form integration
3. **Implement FormField** for each input with proper error handling
4. **Include FormMessage** for validation feedback
5. **Add loading states** for async submissions

**Reference common schemas**: Check `references/component-patterns.md` for form patterns or use pre-built schemas from `assets/templates/utilities/form-schema/common-schemas.ts`.

**Use templates**: Copy from `assets/templates/forms/` for:
- `basic-form/` - Simple contact/registration forms
- `multi-step-form/` - Wizards and multi-page forms
- `dynamic-form/` - Forms with conditional fields
- `search-form/` - Search and filter interfaces

### Data Tables

For data table requests:

1. **Use TanStack Table** (React Table) integration
2. **Define column definitions** with sorting, filtering capabilities
3. **Implement pagination** for large datasets
4. **Add row actions** via dropdown menus
5. **Include selection** for bulk operations

**Template**: Use `assets/templates/data-display/data-table/data-table.tsx` for a complete implementation with sorting, filtering, pagination, and actions.

**Patterns**: Refer to `references/component-patterns.md` under "Data Table Pattern" section for detailed examples.

### Dialogs and Modals

For dialog/modal requests:

1. **Use Dialog or Sheet** depending on use case (Dialog for center, Sheet for side panels)
2. **Control state externally** when needed with `open` and `onOpenChange`
3. **Include proper ARIA labels** for accessibility
4. **Handle form submission** within dialogs correctly
5. **Reset state on close** to avoid stale data

**Patterns**: See `references/component-patterns.md` for Dialog and Sheet patterns.

**Templates**: Check `assets/templates/overlays/` for dialog and sheet examples.

### Layouts

For layout requests (dashboard, settings, auth pages):

**Templates available in `assets/templates/layouts/`**:
- `dashboard-layout/` - Sidebar + header + content area
- `settings-layout/` - Tabbed settings pages
- `auth-layout/` - Centered auth forms with branding
- `landing-layout/` - Marketing/landing page structure

**Use the template that matches the request** and customize as needed.

### Authentication Forms

For auth-related requests (login, signup, password reset):

**Templates in `assets/templates/auth/`**:
- `login-form/` - Complete login with social auth options
- `signup-form/` - Registration with validation
- `password-reset/` - Password recovery flow
- `profile-form/` - User profile editing

These templates include:
- Proper validation with Zod
- Loading states
- Error handling
- Social authentication UI
- Responsive design

## Reviewing Components

When asked to review shadcn/ui code:

### Review Checklist

1. **Composition Pattern**: Check if using composition over configuration
2. **Type Safety**: Verify TypeScript types and Zod schemas
3. **Accessibility**: Ensure proper ARIA labels and keyboard navigation
4. **Styling**: Confirm using semantic color tokens (not hardcoded colors)
5. **Form Integration**: Validate React Hook Form + Zod pattern
6. **Error Handling**: Check for proper error states and user feedback
7. **Performance**: Look for unnecessary re-renders or missing memoization

### Reference Best Practices

**Consult `references/best-practices.md`** for detailed criteria on:
- Form handling patterns
- Component composition
- Accessibility requirements
- TypeScript best practices
- Common anti-patterns to avoid
- Performance considerations

### Common Issues to Flag

**Anti-patterns from `references/best-practices.md`**:
- Over-engineering with configuration props
- Hardcoding colors instead of using CSS variables
- Ignoring accessibility (using `<div>` instead of `<Button>`)
- Not using the Form component for forms
- Missing loading states on async operations

## Customizing Themes

For theme customization requests:

### CSS Variables Approach

shadcn/ui uses CSS variables for theming. To customize:

1. **Modify CSS variables** in `globals.css`
2. **Use HSL format** for colors (e.g., `270 70% 50%`)
3. **Maintain semantic tokens** (primary, secondary, destructive, etc.)
4. **Test both light and dark modes**
5. **Ensure sufficient contrast** for accessibility

**Reference**: See `references/theme-guide.md` for:
- Complete CSS variable structure
- Semantic color token meanings
- Custom color scheme examples
- Dark mode implementation
- Tailwind configuration

### Theme Provider Setup

**Use template**: Copy from `assets/templates/theming/theme-provider/`:
- `theme-provider.tsx` - Next.js theme provider setup
- `theme-switcher.tsx` - Light/dark mode toggle component

### Popular Color Schemes

**Examples in `references/theme-guide.md`**:
- Blue (Professional)
- Green (Success/Growth)
- Orange (Energetic)
- Purple (Creative)

## Using Templates

This skill includes production-ready templates organized by category:

### Template Structure

```
assets/templates/
├── forms/              - Form components (basic, multi-step, dynamic, search)
├── data-display/       - Tables, cards, lists, detail views
├── layouts/            - Dashboard, settings, auth, landing layouts
├── navigation/         - Sidebars, tabs, breadcrumbs, pagination
├── overlays/           - Dialogs, sheets, popovers, command palette
├── feedback/           - Toasts, alerts, loading, empty states
├── auth/               - Login, signup, password reset, profile
├── theming/            - Theme provider, color schemes, variants
└── utilities/          - Form schemas, hooks, utility functions
```

### How to Use Templates

1. **Identify the template** that matches the request
2. **Copy the template** into the project
3. **Customize** as needed for specific requirements
4. **Follow the pattern** established in the template

### Utility Templates

**Pre-built utilities in `assets/templates/utilities/`**:
- `form-schema/common-schemas.ts` - Reusable Zod validation schemas
- `hooks/use-media-query.ts` - Responsive design hooks
- `hooks/use-local-storage.ts` - localStorage integration
- `utils/cn.ts` - Tailwind class merging utility

## Best Practices Reference

For detailed best practices, **consult `references/best-practices.md`** which covers:

### Core Topics
- Copy-paste philosophy
- Composition patterns
- Accessibility guidelines
- Form handling (React Hook Form + Zod)
- Styling and customization
- State management
- TypeScript patterns

### Component-Specific Guidance
- Forms (all input types)
- Dialogs and sheets
- Data tables
- Toast notifications
- Command palette
- And more...

### What to Avoid
- Over-engineering components
- Ignoring accessibility
- Hardcoding colors
- Not using Form component
- Missing error states

## Component Patterns Reference

For implementation patterns, **consult `references/component-patterns.md`** which provides:

- **Form Components**: Input, Select, Checkbox, Radio, Textarea, DatePicker, Combobox
- **Dialog Patterns**: Basic, Controlled, With Form
- **Sheet Patterns**: All sides, With Form
- **Data Table**: Complete implementation with sorting, filtering, pagination
- **Toast Patterns**: Success, Error, With Actions
- **Command Palette**: Keyboard shortcuts integration
- **Tabs, Accordions**: Common UI patterns

Each pattern includes complete, copy-paste ready code examples.

## Implementation Workflow

### For New Component Requests

1. **Understand requirements** - What component type? What features?
   - **Verification**: Confirm all requirements are clear before proceeding
   - **If unclear**: Use AskUserQuestion tool to clarify ambiguous points

2. **Check templates first** - Is there a matching template in `assets/templates/`?
   - **Verification**: Template covers at least 70% of requirements
   - **If no match**: Combine multiple templates or build from component patterns

3. **Reference patterns** - Consult `references/component-patterns.md` for implementation details
   - **Verification**: Pattern matches the specific use case
   - **Error handling**: If pattern not found, refer to best-practices.md for general guidance

4. **Apply best practices** - Follow guidelines from `references/best-practices.md`
   - **Verification**: Check implementation against best practices checklist
   - **Common pitfalls**: Avoid anti-patterns listed in best-practices.md

5. **Implement with types** - Use TypeScript and Zod for validation
   - **Verification**: All types properly inferred from Zod schemas using z.infer
   - **Error check**: Run TypeScript compiler to catch type errors early

6. **Test accessibility** - Verify keyboard navigation and screen readers
   - **Verification**: Can navigate all interactive elements with Tab/Enter/Esc
   - **Verification**: Screen reader announces all elements with proper labels
   - **Tools**: Use browser DevTools accessibility inspector

7. **Test both themes** - Ensure it works in light and dark mode
   - **Verification**: Check all components visually in both themes
   - **Verification**: Verify sufficient contrast (WCAG AA minimum)
   - **If issues**: Review CSS variables in theme-guide.md

### For Review Requests

1. **Read the code** - Understand what it's trying to accomplish
2. **Check against patterns** - Compare with examples in `references/component-patterns.md`
3. **Validate best practices** - Use checklist from `references/best-practices.md`
4. **Flag anti-patterns** - Identify issues from the "What to Avoid" section
5. **Suggest improvements** - Provide specific, actionable feedback
6. **Reference templates** - Point to relevant templates in `assets/templates/`

### For Theme Customization

1. **Identify requirements** - What needs customization? Colors? Typography? Radius?
2. **Reference theme guide** - Consult `references/theme-guide.md` for approach
3. **Use semantic tokens** - Modify CSS variables, not component classes
4. **Test thoroughly** - Check all components in both light and dark modes
5. **Verify contrast** - Ensure accessibility standards are met
6. **Use theme provider** - Implement from `assets/templates/theming/theme-provider/`

## Quality Assurance Process

After implementing any shadcn/ui component, follow this feedback loop to ensure quality:

### Self-Review Checklist

Before considering a component complete, verify:

1. **Composition Pattern** - Using composition over configuration?
2. **Type Safety** - All types inferred from Zod schemas?
3. **Accessibility** - Proper ARIA labels and keyboard navigation?
4. **Styling** - Using semantic tokens (not hardcoded colors)?
5. **Form Integration** - React Hook Form + Zod pattern correctly applied?
6. **Error Handling** - User feedback for all error states?
7. **Performance** - No unnecessary re-renders?

### Iterative Improvement Loop

```
┌─────────────────────────────────────────┐
│  1. Implement Component                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  2. Run Self-Review Checklist            │
└──────────────┬──────────────────────────┘
               │
               ▼
       ╔═══════════════╗
       ║  All Passed?  ║
       ╚═══╤═══════╤═══╝
           │ No    │ Yes
           ▼       ▼
    ┌──────────┐ ┌──────────────────┐
    │ Identify │ │ Final Validation │
    │ Issues   │ │ - Test both themes│
    └────┬─────┘ │ - Test a11y       │
         │       │ - Review with user│
         ▼       └──────────────────┘
    ┌──────────┐
    │ Refactor │
    │ & Fix    │
    └────┬─────┘
         │
         └─────────┐
                   │
                   ▼
            ┌────────────┐
            │ Re-Verify  │
            └────┬───────┘
                 │
                 └──────► Back to Self-Review
```

**Key Points**:
- Never skip the review step after implementation
- Address issues immediately while context is fresh
- Re-verify after each fix to ensure no regressions
- Iterate until all checklist items pass
- Consider consulting references/best-practices.md for guidance

### When to Stop Iterating

Stop and consider the component complete when:
- All self-review checklist items pass ✓
- Component works in both light and dark themes ✓
- Accessibility verified (keyboard + screen reader) ✓
- No TypeScript errors ✓
- User requirements fully met ✓

**Quality Gate**: Don't deliver until all criteria are met.

## Troubleshooting

### Common Issues

**Dark mode not working**:
- Check ThemeProvider is configured
- Verify `darkMode: ["class"]` in tailwind.config
- Ensure CSS variables defined in `.dark` class

**CSS variables not applying**:
- Use `hsl()` function: `hsl(var(--primary))`
- Not just: `var(--primary)`

**Form validation not showing**:
- Include `<FormMessage />` in FormItem
- Verify Zod schema is connected via `resolver`

**TypeScript errors**:
- Infer types from Zod: `z.infer<typeof schema>`
- Extend correct HTML element types
- Use `React.forwardRef` when needed

## Resources Summary

### references/
- `best-practices.md` - Comprehensive best practices guide
- `component-patterns.md` - Complete component implementation patterns
- `theme-guide.md` - Theming and styling guide

### assets/templates/
- `forms/` - Form templates (basic, multi-step, dynamic, search)
- `data-display/` - Data tables, cards, lists
- `layouts/` - Dashboard, settings, auth, landing
- `navigation/` - Sidebars, tabs, breadcrumbs
- `overlays/` - Dialogs, sheets, popovers
- `feedback/` - Toasts, alerts, loading states
- `auth/` - Login, signup, password reset
- `theming/` - Theme provider, color schemes
- `utilities/` - Form schemas, hooks, utils

## Key Reminders

- **Always use composition** over configuration props
- **Always use semantic tokens** for colors (primary, secondary, etc.)
- **Always include FormMessage** in form fields
- **Always test both themes** (light and dark mode)
- **Always use TypeScript** with proper types from Zod
- **Always prioritize accessibility** - use proper HTML elements and ARIA labels
- **Always reference the guides** - don't guess at patterns, use the references
