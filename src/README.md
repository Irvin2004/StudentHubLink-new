# React source boundary

`src/` is StudentHub's React application boundary.

```text
src/
|-- assets/
|-- components/
|   |-- common/
|   |-- feedback/
|   |-- forms/
|   `-- layout/
|-- config/
|-- context/
|-- firebase/
|-- features/
|   `-- discovery/       Permission-aware unified knowledge search
|-- hooks/
|-- models/
|-- pages/
|-- routes/
|-- services/
|-- styles/
|-- App.jsx
`-- main.jsx
```

The existing `js/` and `css/` modules remain available while feature routes are
migrated incrementally. New React components must call focused services rather
than Firebase directly. When a legacy feature is migrated, remove its replaced
entry point in the same change.
