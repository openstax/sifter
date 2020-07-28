Overview: Relationships, Things, and Languages

# Relationships (a.k.a Family Tree)

ancestor, descendant, parent, sibling, child (aka direct descendant)


# Things: XML tree

- Element can have children: other elements or text
- Attribute is a property of an element: has a value and a name which identifies the property
- Namespace identifies what the meaning of the element is... `<p>` could mean paragraph or part number


# Lanugages: CSS and Xpath

## CSS

There are limitations which we will run into but it is quite expressive.

- `*`: a wildcard for any element
- `A B`: find all `B` that are a descendant of `A`
- `A > B`: find all `B` that are a direct descendant of `A`
- (rare) `A ~ B`: find all `B` that have a sibling `A` that occurs before them
- (rare) `A + B`: find all `B` that immediately follow an `A`
- Attributes: (the element is _optional_)
    - `A.foo` find all `A` that contain the class `foo`
    - `A[name]` find all `A` that have the property `name` set (does not matter what it is set to)
    - `A[name='philip']` find all `A` that have the property `name` set to `philip`
    - For more, see [here](https://developer.mozilla.org/en-US/docs/Web/CSS/Attribute_selectors)
- Nth: `A:nth-of-type(1)` find the first `A`
- Negation: `A:not(.foo)`


### Limitations

- Cannot select elements that have a descendant in them... it's subtle. For example, it cannot select a note that contains math but it can select math inside a note.
- Negation: can only apply to the current element. For example, it cannot find "notes that do not contain math" 
- Cannot search text


## XPath

The syntax is similar to CSS but context is more important. This allows XPath to be more expressive.

For more, see the [Mozilla Documentation](https://developer.mozilla.org/en-US/docs/Web/XPath/Comparison_with_CSS_selectors) or the [1.0 Specification](https://www.w3.org/TR/xpath-10/)

- `*`: a wildcard for any element
- `A//B`: find all `B` that are a descendant of `A`
- `A/B`: find all `B` that are a direct descendant of `A`
- Attributes: (the element is _required_)
    - There is **no good way to search for classes**
    - `A[@name]` find all `A` that have the property `name` set (does not matter what it is set to)
    - `A[@name='philip']` find all `A` that have the property `name` set to `philip`
- Nth: `A[1]` find the first `A`
- Negation: `A[not(@class)]` find all `A` that does not have a class

**Note:** Since "descendant" is not just whitespace (like in CSS) then you have to start every XPath with `//`

