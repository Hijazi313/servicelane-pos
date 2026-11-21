import { Alert, Button, Checkbox, Drawer, Radio, Space, Spin, Typography } from 'antd';
import type { Offering } from '@servicelane/api-contracts/menu';
import type { ResolvedSelection, Selection } from './cashier-menu-api';
import { useOfferingSelection } from './use-offering-selection';
import { money } from './cashier-money';

export function SelectOffering({ offering, onClose, onAdd }: { offering: Offering; onClose: () => void; onAdd: (selection: Selection, resolved: ResolvedSelection) => void }) {
  const { variantId, setVariantId, selected, setSelected, groups, valid, selection, preview, ready } = useOfferingSelection(offering);
  return <Drawer rootClassName="cashier-selection" title={offering.name} open onClose={onClose} destroyOnHidden footer={<Space className="cashier-selection-actions" wrap><Button onClick={onClose}>Cancel</Button><Button type="primary" disabled={!ready} onClick={() => { if (ready && preview.data) onAdd(selection, preview.data); }}>Add to order</Button></Space>}>
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {offering.kind === 'item' && offering.variants.length > 1 && <div><Typography.Title level={5}>Size</Typography.Title><Radio.Group value={variantId} onChange={event => setVariantId(event.target.value)} options={offering.variants.map(variant => ({ label: `${variant.name} (${offering.currencyCode} ${variant.price})`, value: variant.id }))}/></div>}
      {groups.map(group => <div key={group.id}><Typography.Title level={5}>{group.name}</Typography.Title><p>Choose {'minimum' in group ? `${group.minimum}–${group.maximum}` : `up to ${group.maximum}`}</p><Checkbox.Group value={selected[group.id] ?? []} onChange={values => setSelected({ ...selected, [group.id]: values.map(String) })}><Space direction="vertical">{group.options.map(option => <Checkbox key={option.id} value={option.id}>{option.name} (+{offering.currencyCode} {option.surcharge})</Checkbox>)}</Space></Checkbox.Group></div>)}
      {!valid && <Typography.Text type="secondary">Choose the required size and options within the stated limits.</Typography.Text>}
      {valid && preview.isFetching && <div role="status"><Spin size="small"/> Calculating price…</div>}
      {valid && !preview.isFetching && preview.isError && <Alert type="error" showIcon message="Unable to calculate the price. The menu may have changed." action={<Button onClick={() => void preview.refetch()}>Try again</Button>}/>}
      {ready && preview.data && <Alert type="info" showIcon message={`Price per item: ${money(preview.data.unitMinor, preview.data.currencyCode, preview.data.scale)}`} description="The price is checked again when the order is saved."/>}
    </Space>
  </Drawer>;
}
