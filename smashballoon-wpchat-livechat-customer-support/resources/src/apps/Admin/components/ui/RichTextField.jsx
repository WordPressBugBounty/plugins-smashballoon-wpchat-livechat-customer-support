import { createPortal } from 'react-dom';
import React, { useEffect, useRef, useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import SvgLoader from '@Components/SvgLoader';
import { cn } from '@Utils/cn';
import { Extension, getMarkRange } from '@tiptap/core';
import Bold from '@tiptap/extension-bold';
import CharacterCount from '@tiptap/extension-character-count';
import Document from '@tiptap/extension-document';
import HardBreak from '@tiptap/extension-hard-break';
import History from '@tiptap/extension-history';
import Italic from '@tiptap/extension-italic';
import Link from '@tiptap/extension-link';
import Paragraph from '@tiptap/extension-paragraph';
import Placeholder from '@tiptap/extension-placeholder';
import Text from '@tiptap/extension-text';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import { Button } from './Button';
import { Description, Label } from './Field';
import { Popover } from './Popover';
import { TextField } from './TextField';

// Plugin that highlights the range being linked while the link editor is open.
// Native selection disappears when focus moves to the URL input, so this keeps
// the targeted text visibly highlighted. Driven by a transaction meta carrying
// `{ from, to }` (or `{ clear: true }`).
const linkHighlightKey = new PluginKey('wpcLinkHighlight');

const LinkHighlight = Extension.create({
  name: 'linkHighlight',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: linkHighlightKey,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, old) {
            const meta = tr.getMeta(linkHighlightKey);
            if (meta) {
              if (meta.clear || meta.from === meta.to) return DecorationSet.empty;
              return DecorationSet.create(tr.doc, [
                Decoration.inline(meta.from, meta.to, { class: 'wpc-link-active' }),
              ]);
            }
            return old.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations(state) {
            return linkHighlightKey.getState(state);
          },
        },
      }),
    ];
  },
});

/**
 * Normalize a user-entered URL so bare domains become valid absolute links.
 *
 * Leaves URLs that already have a scheme (http:, mailto:, tel:, file:, …),
 * anchors (`#…`) and root-relative paths (`/…`) untouched; turns a bare email
 * address into a `mailto:` link; otherwise prepends `https://` so e.g.
 * `example.com` does not resolve as a relative path.
 *
 * @param {string} url - The raw URL string.
 * @returns {string} The normalized URL (empty string stays empty).
 */
function normalizeLinkUrl(url) {
  const trimmed = (url || '').trim();
  if (trimmed === '') return '';
  // Block dangerous URI schemes before the allowlist check — these would
  // otherwise pass through and end up rendered via dangerouslySetInnerHTML.
  // Returning '' makes the caller fall back to removing the link (the safe path).
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return '';
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) || trimmed.startsWith('#') || trimmed.startsWith('/')) {
    return trimmed;
  }
  // A bare email address becomes a mailto: link.
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return `mailto:${trimmed}`;
  }
  return `https://${trimmed}`;
}

/**
 * Whether a raw URL string is acceptable to apply as a link.
 *
 * An empty string is valid (applying it removes the link). Anchors,
 * root-relative paths and non-web schemes (`mailto:`, `tel:`, …) pass through.
 * For http/https links — including bare domains that `normalizeLinkUrl` will
 * prefix with `https://` — the host must be a real domain (a label plus a 2+
 * character TLD, e.g. `google.com`) or an IPv4 address. Bare words (`asdf`) and
 * TLD-only inputs (`.com`) are rejected, as are dangerous schemes that
 * `normalizeLinkUrl` strips to an empty string.
 *
 * @param {string} url - The raw URL string.
 * @returns {boolean} True when the URL can be applied.
 */
function isValidLinkUrl(url) {
  const trimmed = (url || '').trim();
  // Empty is valid: applying an empty URL removes the link.
  if (trimmed === '') return true;
  const normalized = normalizeLinkUrl(trimmed);
  // normalizeLinkUrl returns '' only for stripped dangerous schemes here.
  if (normalized === '') return false;
  if (normalized.startsWith('#') || normalized.startsWith('/')) return true;
  if (/^(mailto|tel):/i.test(normalized)) return true;
  try {
    const { protocol, hostname } = new URL(normalized);
    if (protocol !== 'http:' && protocol !== 'https:') return true;
    const isDomain = /^([a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(hostname);
    const isIPv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
    return isDomain || isIPv4;
  } catch {
    return false;
  }
}

/**
 * Toolbar button for the rich text editor.
 *
 * @param {Object}      props            - Component props.
 * @param {boolean}     [props.isActive] - Whether the formatting mark is active.
 * @param {boolean}     [props.disabled] - Whether the button is disabled.
 * @param {Function}    props.onClick    - Click handler.
 * @param {string}      [props.icon]     - SvgLoader icon name (used when no children).
 * @param {string}      props.label      - Accessible label.
 * @param {string}      [props.className] - Extra classes.
 * @param {JSX.Element} [props.children] - Optional custom button content.
 * @returns {JSX.Element} The rendered toolbar button.
 */
const ToolbarButton = React.forwardRef(function ToolbarButton(
  { isActive, onClick, icon, label, children, className, disabled },
  ref,
) {
  return (
    <button
      ref={ref}
      type='button'
      // Keep the editor selection while clicking the toolbar.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      aria-pressed={isActive}
      className={cn(
        'wpchat:flex wpchat:h-7 wpchat:w-7 wpchat:items-center wpchat:justify-center wpchat:rounded-sm wpchat:border wpchat:border-transparent wpchat:text-sm wpchat:transition-colors wpchat:focus:shadow-none wpchat:focus:outline-none',
        disabled
          ? 'wpchat:cursor-not-allowed wpchat:text-gray-300 wpchat:[&_svg]:fill-gray-300'
          : isActive
            ? 'wpchat:cursor-pointer wpchat:bg-wp-light-blue-500-20 wpchat:text-wp-blue-500 wpchat:[&_svg]:fill-wp-blue-500'
            : 'wpchat:cursor-pointer wpchat:text-gray-700 wpchat:hover:bg-gray-100',
        className,
      )}
    >
      {children || <SvgLoader name={icon} className='wpchat:h-4 wpchat:w-4' aria-hidden='true' />}
    </button>
  );
});

/**
 * Controlled rich-text field built on TipTap, mirroring the TextField API.
 *
 * Offers Bold, Italic and Link formatting and a visible-character counter that
 * counts against `maxLength`. Formatting controls live in a bottom bar that is
 * revealed on focus (its space is always reserved, so the field never jumps).
 *
 * Links are managed through a floating popover (the shared `Popover` component):
 * hovering, clicking or arrowing into a link shows its text, URL and Edit /
 * Remove actions; the URL in the popover opens in a new tab (clicking the link
 * in the editor never navigates). The Edit form exposes separate Text and URL
 * fields.
 *
 * @param {Object}   props                       - Component props.
 * @param {string}   props.name                  - Field name.
 * @param {string}   [props.label]               - Optional field label rendered above the editor.
 * @param {string}   props.value                 - The current value as an HTML string.
 * @param {Function} props.onChange              - Called with the updated HTML string.
 * @param {string}   [props.placeholder]         - Placeholder text shown when empty.
 * @param {number}   [props.maxLength]           - Maximum number of visible characters.
 * @param {boolean}  [props.showMaxLength]       - Whether to render the character counter.
 * @param {boolean}  [props.isRequired]          - Whether the field is required.
 * @param {string}   [props.errorMessage]        - Optional error message rendered below the editor.
 * @param {string}   [props.className]           - Additional classes for the wrapper.
 * @param {string}   [props.inputClassName]      - Additional classes for the editable area.
 * @param {string}   [props.descriptionClassName] - Additional classes for the counter description.
 * @returns {JSX.Element|null} The rendered rich-text field.
 */
export default function RichTextField({
  name,
  label,
  value = '',
  onChange,
  placeholder,
  maxLength,
  showMaxLength,
  isRequired,
  errorMessage,
  className,
  inputClassName,
  descriptionClassName = '',
}) {
  // Whether the editor currently holds focus — drives the bottom toolbar reveal.
  const [isFocused, setIsFocused] = useState(false);

  // Link popover: 'closed' | 'read' (text/url + actions) | 'edit' (text/url form).
  const [linkMode, setLinkMode] = useState('closed');
  const linkModeRef = useRef('closed');
  const setMode = (mode) => {
    linkModeRef.current = mode;
    setLinkMode(mode);
  };

  // Read-mode contents and the edit-form fields.
  const [readData, setReadData] = useState({ text: '', href: '' });
  const [editText, setEditText] = useState('');
  const [editUrl, setEditUrl] = useState('');

  // The document range the popover currently acts on, and the DOM element the
  // popover is anchored to (the link's <a>, or the toolbar button when adding).
  const targetRangeRef = useRef(null);
  // Invisible element the popover is anchored to; we move it to the link/selection.
  const anchorRef = useRef(null);
  const hideTimerRef = useRef(null);
  const hoveringRef = useRef(false);
  // Skip the next caret-driven popover (e.g. the caret landing inside a link we
  // just created/edited, or after an explicit close), so it doesn't re-open.
  const suppressCaretRef = useRef(false);

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Bold,
      Italic,
      History,
      HardBreak,
      // `inclusive: false` stops the link mark from extending onto text typed at
      // the end of a link, so typing after a link produces normal (unlinked) text.
      // `autolink`/`linkOnPaste` turn URLs typed (on space/enter) or pasted into
      // links automatically; `defaultProtocol: 'https'` so bare domains resolve.
      // `openOnClick: false` — clicking a link in the editor never navigates; it
      // just surfaces the popover. Opening happens only from the popover's URL
      // (a real link to a new tab). `target`/`rel` are kept for the saved output.
      Link.extend({ inclusive: false }).configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        defaultProtocol: 'https',
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer nofollow' },
      }),
      CharacterCount.configure({ limit: maxLength }),
      // Renders `placeholder` while the editor is empty (adds the
      // `is-editor-empty` class + `data-placeholder`, surfaced via CSS below).
      Placeholder.configure({ placeholder: placeholder || '' }),
      LinkHighlight,
    ],
    content: value,
    onUpdate: ({ editor: currentEditor }) => {
      onChange?.(currentEditor.getHTML());
    },
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
    editorProps: {
      attributes: {
        ...(name ? { name } : {}),
        ...(isRequired ? { 'aria-required': 'true' } : {}),
        class: cn(
          'wpchat:tiptap wpchat:min-h-[84px] wpchat:w-full wpchat:cursor-text wpchat:px-4 wpchat:py-3 wpchat:text-sm wpchat:text-gray-900 wpchat:outline-none',
          // Placeholder: shown via the empty paragraph's ::before (the Placeholder
          // extension adds `is-editor-empty` + `data-placeholder`).
          'wpchat:[&_.is-editor-empty:first-child]:before:pointer-events-none wpchat:[&_.is-editor-empty:first-child]:before:float-left wpchat:[&_.is-editor-empty:first-child]:before:h-0 wpchat:[&_.is-editor-empty:first-child]:before:text-gray-500 wpchat:[&_.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]',
          // Paragraphs carry no outer margin; spacing appears only *between*
          // paragraphs, so the field's padding alone controls the top/bottom inset
          // (otherwise the default <p> margin doubles up with the padding).
          // `font-size: inherit` so the paragraphs follow the field's size instead
          // of WP admin's default `p { font-size: 13px }`.
          'wpchat:[&_p]:m-0 wpchat:[&_p]:[font-size:inherit] wpchat:[&_p:not(:first-child)]:mt-2',
          // Links should read as links inside the editor, not plain text.
          // Link color matches the primary button blue.
          'wpchat:[&_a]:cursor-pointer wpchat:[&_a]:text-wp-blue-500 wpchat:[&_a]:underline wpchat:[&_a]:underline-offset-2',
          // Keep the targeted text highlighted while the link editor is open
          // (native selection vanishes once the URL input takes focus).
          'wpchat:[&_.wpc-link-active]:bg-wp-light-blue-500-20',
          inputClassName,
        ),
      },
    },
  });

  // Reactive editor state. Reading editor.isActive() directly in render is not
  // reliable here (React Compiler memoizes it); useEditorState subscribes properly.
  const editorState = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      isBold: e?.isActive('bold') ?? false,
      isItalic: e?.isActive('italic') ?? false,
      isLink: e?.isActive('link') ?? false,
      count: e?.storage.characterCount?.characters() ?? 0,
    }),
  });
  const isBold = editorState?.isBold ?? false;
  const isItalic = editorState?.isItalic ?? false;
  const isLink = editorState?.isLink ?? false;
  const count = editorState?.count ?? 0;
  const isOverLimit = maxLength ? count >= maxLength : false;

  // The link range under a collapsed caret (keyboard navigation), or null.
  // Lets us surface the popover without a mouse.
  const caretLink = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e || !e.isFocused) return null;
      const sel = e.state.selection;
      if (!sel.empty) return null;
      const range = getMarkRange(e.state.doc.resolve(sel.from), e.schema.marks.link);
      return range ? { from: range.from, to: range.to } : null;
    },
  });

  // Bottom toolbar is shown while the field is focused or a link popover is open.
  const barVisible = isFocused || linkMode !== 'closed';

  // Highlight (or clear) the range being linked via the LinkHighlight plugin.
  const setLinkHighlight = (range) => {
    if (!editor?.view) return;
    editor.view.dispatch(editor.state.tr.setMeta(linkHighlightKey, range || { clear: true }));
  };

  // Resolve the link at a document position into {from, to, text, href} (or null).
  const linkAt = (pos) => {
    if (!editor) return null;
    const { doc, schema } = editor.state;
    const range = getMarkRange(doc.resolve(pos), schema.marks.link);
    if (!range) return null;
    const text = doc.textBetween(range.from, range.to, ' ');
    let href = '';
    doc.nodesBetween(range.from, range.to, (node) => {
      const mark = node.marks?.find((m) => m.type.name === 'link');
      if (mark) href = mark.attrs.href;
    });
    return { from: range.from, to: range.to, text, href };
  };

  // The <a> DOM element covering a document position, used to anchor the popover.
  const linkElAt = (pos) => {
    if (!editor) return null;
    const dom = editor.view.domAtPos(pos)?.node;
    const el = dom?.nodeType === 3 ? dom.parentElement : dom;
    return el?.closest?.('a') || null;
  };

  // Viewport rect for a document range — the link's <a> box if there is one,
  // otherwise the bounding box of the selected text. So a brand-new link from a
  // text selection anchors to that text, not to the toolbar button.
  const selRect = (from, to) => {
    const a = editor.view.coordsAtPos(from);
    const b = editor.view.coordsAtPos(to);
    const top = Math.min(a.top, b.top);
    const bottom = Math.max(a.bottom, b.bottom);
    const left = Math.min(a.left, b.left);
    const right = Math.max(a.right, b.right);
    return {
      top,
      left,
      bottom,
      right,
      width: Math.max(right - left, 1),
      height: Math.max(bottom - top, 1),
    };
  };
  const rectForRange = (from, to) => {
    const el = linkElAt(from + 1) || linkElAt(from);
    return el ? el.getBoundingClientRect() : selRect(from, to);
  };

  // Move the invisible anchor to a viewport rect, stored in document coords so it
  // scrolls with the page and react-aria can keep the popover attached.
  const placeAnchor = (rect) => {
    const el = anchorRef.current;
    if (!el || !rect) return;
    el.style.top = `${rect.top + window.scrollY}px`;
    el.style.left = `${rect.left + window.scrollX}px`;
    el.style.width = `${rect.width}px`;
    el.style.height = `${rect.height}px`;
  };

  const closePopover = () => {
    setMode('closed');
    setLinkHighlight(null);
    suppressCaretRef.current = true;
  };

  const showRead = (link) => {
    targetRangeRef.current = { from: link.from, to: link.to };
    placeAnchor(rectForRange(link.from, link.to));
    setReadData({ text: link.text, href: link.href });
    setMode('read');
  };

  const openEdit = (seed) => {
    targetRangeRef.current = { from: seed.from, to: seed.to };
    placeAnchor(rectForRange(seed.from, seed.to));
    setEditText(seed.text);
    setEditUrl(seed.href);
    setLinkHighlight(seed.from !== seed.to ? targetRangeRef.current : null);
    setMode('edit');
  };

  // Keep the editor in sync with external value changes without disrupting
  // the cursor while the user is typing.
  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  // Surface (or dismiss) the read popover as the caret moves in/out of a link
  // via the keyboard. Hover is handled separately on the editor element.
  useEffect(() => {
    if (!editor || linkModeRef.current === 'edit') return;
    if (caretLink) {
      if (suppressCaretRef.current) {
        suppressCaretRef.current = false;
        return;
      }
      const link = linkAt(caretLink.from);
      if (!link) return;
      showRead(link);
    } else if (linkModeRef.current === 'read' && !hoveringRef.current) {
      closePopover();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caretLink, editor]);

  if (!editor) return null;

  /** Build the seed for the toolbar link button from the current selection. */
  const seedFromSelection = () => {
    const sel = editor.state.selection;
    if (sel.empty) {
      const link = linkAt(sel.from);
      if (link) return link;
      return { from: sel.from, to: sel.from, text: '', href: '' };
    }
    return {
      from: sel.from,
      to: sel.to,
      text: editor.state.doc.textBetween(sel.from, sel.to, ' '),
      href: '',
    };
  };

  /** Toolbar link button always opens the editor — it never silently deletes. */
  const onLinkButton = () => openEdit(seedFromSelection());

  // `urlHasError` drives the red error state — only once the user has typed
  // something malformed, so an empty field is not flagged. `canApply` also
  // requires a non-empty URL, so Apply is disabled by default (removing a link
  // is done with the dedicated Remove button, not by clearing the URL).
  const urlIsValid = isValidLinkUrl(editUrl);
  const urlHasError = editUrl.trim() !== '' && !urlIsValid;
  const canApply = editUrl.trim() !== '' && urlIsValid;

  /** Apply the edit form. */
  const applyEdit = () => {
    // Bail when there's nothing valid to apply — the Apply button is disabled,
    // but Enter can still fire here.
    if (!canApply) return;
    const range = targetRangeRef.current;
    const url = normalizeLinkUrl(editUrl);
    const finalText = editText.trim() || url;
    const node = { type: 'text', text: finalText, marks: [{ type: 'link', attrs: { href: url } }] };
    if (range.from !== range.to) {
      editor.chain().focus().insertContentAt(range, node).run();
    } else {
      editor.chain().focus().insertContentAt(range.from, node).run();
    }
    closePopover();
  };

  /** Remove the link the popover is acting on. */
  const removeLink = () => {
    const range = targetRangeRef.current;
    if (range) editor.chain().focus().setTextSelection(range).unsetLink().run();
    closePopover();
  };

  /** Switch the popover from read to edit, seeded from the targeted link. */
  const editFromRead = () => {
    const range = targetRangeRef.current;
    const link = range ? linkAt(range.from) : null;
    openEdit(link || seedFromSelection());
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closePopover();
      editor.commands.focus();
    }
  };

  // Reveal the read popover on hover, with a small grace period so moving the
  // pointer from the link onto the popover does not dismiss it.
  const scheduleHide = () => {
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      hoveringRef.current = false;
      if (linkModeRef.current === 'read') closePopover();
    }, 160);
  };

  const handleEditorMouseOver = (e) => {
    const anchor = e.target.closest('a');
    if (!anchor || linkModeRef.current === 'edit') return;
    clearTimeout(hideTimerRef.current);
    hoveringRef.current = true;
    const pos = editor.view.posAtDOM(anchor, 0);
    const link = linkAt(pos) || linkAt(pos + 1);
    if (link) showRead(link);
  };

  const handleEditorMouseOut = (e) => {
    if (e.target.closest('a') && linkModeRef.current === 'read') scheduleHide();
  };

  return (
    <div
      className={cn(
        'wpchat:group wpchat:flex wpchat:w-full wpchat:flex-col wpchat:gap-1',
        className,
      )}
    >
      {label && <Label>{label}</Label>}
      <div className='wpchat:relative wpchat:flex wpchat:flex-col wpchat:overflow-hidden wpchat:rounded-sm wpchat:border wpchat:border-gray-200 wpchat:focus-within:outline wpchat:focus-within:outline-4 wpchat:focus-within:outline-wp-light-blue-500-20'>
        {/* Editable area. The wrapper reserves space at the bottom so the toolbar
            can slide in without shifting the field's height. */}
        <div
          onMouseOver={handleEditorMouseOver}
          onMouseOut={handleEditorMouseOut}
          style={{ paddingBottom: '2.75rem' }}
        >
          <EditorContent editor={editor} />
        </div>

        {/* Bottom toolbar: fades and rises a few px into view on focus (hidden via
            opacity rather than full-height travel, for a subtler reveal). */}
        <div
          className={cn(
            'wpchat:absolute wpchat:inset-x-0 wpchat:bottom-0 wpchat:flex wpchat:items-center wpchat:gap-1 wpchat:border-t wpchat:border-gray-200 wpchat:bg-gray-50 wpchat:px-2 wpchat:py-1.5 wpchat:transition wpchat:duration-100 wpchat:ease-[cubic-bezier(0.16,1,0.3,1)]',
            barVisible
              ? 'wpchat:translate-y-0 wpchat:opacity-100'
              : // Reduced motion: keep the opacity fade, drop the rise.
                'wpchat:pointer-events-none wpchat:translate-y-1 wpchat:opacity-0 wpchat:motion-reduce:translate-y-0',
          )}
        >
          <ToolbarButton
            label={__('Bold', 'smashballoon-wpchat-livechat-customer-support')}
            isActive={isBold}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <span className='wpchat:font-bold'>B</span>
          </ToolbarButton>
          <ToolbarButton
            label={__('Italic', 'smashballoon-wpchat-livechat-customer-support')}
            isActive={isItalic}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <span className='wpchat:font-serif wpchat:italic'>I</span>
          </ToolbarButton>
          <ToolbarButton
            icon='link'
            label={__('Add or edit link', 'smashballoon-wpchat-livechat-customer-support')}
            isActive={isLink || linkMode !== 'closed'}
            onClick={onLinkButton}
          />
        </div>
      </div>

      {showMaxLength && maxLength && (
        <Description
          className={cn(
            'wpchat:inline-block wpchat:text-sm wpchat:leading-relaxed wpchat:transition-opacity',
            // Only reveal on focus; reserve the line's height the rest of the time
            // so the layout doesn't jump. When the limit is hit, keep it visible in
            // dark red to flag the error regardless of focus.
            isOverLimit
              ? 'wpchat:text-red-700 wpchat:opacity-100'
              : 'wpchat:text-gray-700 wpchat:opacity-0 wpchat:group-focus-within:opacity-100',
            descriptionClassName,
          )}
        >
          {sprintf(
            __('%1$d/%2$d characters', 'smashballoon-wpchat-livechat-customer-support'),
            count,
            maxLength,
          )}
        </Description>
      )}
      {errorMessage && (
        <span className='wpchat:block wpchat:text-sm wpchat:text-red-700'>{errorMessage}</span>
      )}

      {/* Invisible anchor the popover positions against — moved to the link's
          box or the selected text. Portaled to <body> with document-absolute
          coords so it scrolls with the page. */}
      {createPortal(
        <span
          ref={anchorRef}
          aria-hidden='true'
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 0,
            height: 0,
            pointerEvents: 'none',
          }}
        />,
        document.body,
      )}

      {/* Link popover — built on the shared Popover component so it matches the
          rest of the admin (positioning, animation, dismiss, a11y). Read mode
          shows the link text, URL and actions; edit mode shows the form.
          `isNonModal` keeps the editor interactive while the popover is open. */}
      <Popover
        isNonModal
        triggerRef={anchorRef}
        placement='bottom'
        isOpen={linkMode !== 'closed'}
        onOpenChange={(open) => {
          if (!open) closePopover();
        }}
        className='wpchat:w-[360px] wpchat:max-w-[90vw]'
      >
        {/* `.wp-chat-admin` so the portaled inputs inherit the same focus-ring
            rule the rest of the admin fields use. */}
        <div
          className='wp-chat-admin wpchat:flex wpchat:flex-col wpchat:gap-0.5 wpchat:px-5 wpchat:py-4'
          onMouseEnter={() => {
            clearTimeout(hideTimerRef.current);
            hoveringRef.current = true;
          }}
          onMouseLeave={() => {
            if (linkMode === 'read') scheduleHide();
          }}
        >
          {linkMode === 'edit' ? (
            <div className='wpchat:flex wpchat:flex-col wpchat:gap-2' onKeyDown={handleEditKeyDown}>
              <TextField
                label={__('Text', 'smashballoon-wpchat-livechat-customer-support')}
                type='text'
                value={editText}
                onChange={setEditText}
                placeholder={__('Link text', 'smashballoon-wpchat-livechat-customer-support')}
                autoFocus={!editText}
                inputClassName='wpchat:w-full'
              />
              <TextField
                label={__('URL', 'smashballoon-wpchat-livechat-customer-support')}
                type='text'
                value={editUrl}
                onChange={setEditUrl}
                placeholder={__('Enter a URL', 'smashballoon-wpchat-livechat-customer-support')}
                autoFocus={!!editText}
                inputClassName='wpchat:w-full'
                variant={urlHasError ? 'error' : ''}
                isInvalid={urlHasError}
                errorMessage={
                  urlHasError
                    ? __(
                        'Please enter a valid URL.',
                        'smashballoon-wpchat-livechat-customer-support',
                      )
                    : undefined
                }
              />
              <div className='wpchat:mt-3 wpchat:flex wpchat:justify-end wpchat:gap-2'>
                <Button
                  variant='secondary'
                  onPress={() => {
                    closePopover();
                    editor.commands.focus();
                  }}
                >
                  {__('Cancel', 'smashballoon-wpchat-livechat-customer-support')}
                </Button>
                <Button variant='primary' onPress={applyEdit} isDisabled={!canApply}>
                  {__('Apply', 'smashballoon-wpchat-livechat-customer-support')}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {readData.text && (
                <div className='wpchat:truncate wpchat:text-sm wpchat:font-semibold wpchat:text-gray-900'>
                  {readData.text}
                </div>
              )}
              <a
                href={readData.href}
                target='_blank'
                rel='noopener noreferrer'
                className='wpchat:flex wpchat:items-center wpchat:gap-1 wpchat:text-xs wpchat:text-wp-blue-500 wpchat:hover:underline'
              >
                <span className='wpchat:truncate'>{readData.href}</span>
                {/* ↗ signals the URL opens in a new tab */}
                <SvgLoader
                  name='topRightArrow'
                  aria-hidden='true'
                  className='wpchat:h-3 wpchat:w-3 wpchat:shrink-0 wpchat:fill-wp-blue-500'
                />
              </a>
              <div className='wpchat:mt-2.5 wpchat:flex wpchat:gap-2'>
                <Button variant='primary' onPress={editFromRead} className='wpchat:flex-1'>
                  {__('Edit', 'smashballoon-wpchat-livechat-customer-support')}
                </Button>
                <Button variant='danger' onPress={removeLink} className='wpchat:flex-1'>
                  {__('Remove', 'smashballoon-wpchat-livechat-customer-support')}
                </Button>
              </div>
            </>
          )}
        </div>
      </Popover>
    </div>
  );
}
