export function jsonPreview(props) {
  const { data, className } = props;

  return (
    <pre className={className || 'wpchat:mt-4 wpchat:text-xs'}>{JSON.stringify(data, null, 2)}</pre>
  );
}
