import { Radio, RadioGroup } from 'react-aria-components';
import TitleDescription from '@Components/TitleDescription';

/**
 * ColorPresetSelect component allows users to choose from a list of predefined color options.
 *
 * @component
 * @param {Object} props - Component props.
 * @param {string} props.label - The label displayed above the color selector.
 * @param {string} [props.description] - Optional description displayed below the label.
 * @param {Array<{ name: string, slug: string, color: string }>} props.options - Array of color options with a display name, unique slug, and color value.
 * @param {string} props.value - The currently selected color value.
 * @param {function(string): void} props.onChange - Callback function triggered when a new color is selected.
 *
 * @returns {JSX.Element} The rendered ColorPresetSelect component.
 */
export default function ColorPresetSelect({ label, description, options, value, onChange }) {
  return (
    <>
      <TitleDescription title={label} description={description} className='wpchat:mb-6' />
      <RadioGroup
        className='wpchat:flex wpchat:w-full wpchat:flex-col wpchat:gap-2'
        defaultValue={options[0]?.name}
        value={value}
        onChange={onChange}
      >
        {options.map((option) => (
          <SingleOption
            key={option.slug}
            name={option.name}
            slug={option.slug}
            color={option.color}
          />
        ))}
      </RadioGroup>
    </>
  );
}

function SingleOption({ name, color }) {
  const { lightness, chroma, hue } = color;

  return (
    <Radio
      value={hue}
      className={({ isFocusVisible, isSelected, isPressed }) =>
        `wpchat:border-gray-200 wpchat:hover:bg-gray-50 wpchat:cursor-pointer wpchat:rounded-lg wpchat:border wpchat:bg-white wpchat:px-3 wpchat:py-3.5`
      }
    >
      <div className='wpchat:flex wpchat:items-center wpchat:gap-3.5'>
        <span
          className='wpchat:h-6 wpchat:w-6 wpchat:rounded-full wpchat:border wpchat:border-gray-900/10'
          style={{ backgroundColor: `oklch(${lightness} ${chroma} ${hue})` }}
        />
        <p className='wpchat:text-gray-900 wpchat:m-0 wpchat:text-sm wpchat:leading-relaxed'>
          {name}
        </p>
      </div>
    </Radio>
  );
}
