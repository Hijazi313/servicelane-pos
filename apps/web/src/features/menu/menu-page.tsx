import { Alert, Button, Card, Space, Spin, Table, Tag, Typography } from 'antd';
import { MenuForm } from './menu-form';
import type { Offering } from './menu-api';
import { useMenu } from './use-menu';

export function MenuPage({ onBack }: { onBack: () => void }) {
  const {
    definitions, active, currency, loading, error, saving, uncertain, conflict, latest, savedId, open, editing,
    refresh, save, reloadWhileEditing, startEditing, closeEditor, useLatest, acknowledgeReview,
  } = useMenu();

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Type', key: 'kind', render: (_: unknown, row: Offering) => row.kind === 'item' ? 'Item' : 'Meal deal' },
    { title: 'Price', key: 'price', render: (_: unknown, row: Offering) => row.kind === 'combo' ? `${currency} ${row.basePrice}` : row.variants.map(variant => `${row.sized ? variant.name + ': ' : ''}${currency} ${variant.price}`).join(', ') },
    { title: 'Availability', key: 'availability', render: (_: unknown, row: Offering) => active.some(item => item.id === row.id) ? <Tag color="green">Available</Tag> : <Tag>Unavailable</Tag> },
    { title: '', key: 'edit', render: (_: unknown, row: Offering) => <Button disabled={uncertain || !!error} onClick={() => startEditing(row)}>Edit</Button> },
  ];

  return <div className="access-page menu-page">
    <header className="access-header"><span className="brand-mark" aria-hidden="true">s</span><span>Restaurant workspace</span></header>
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Button onClick={onBack}>Back to workspace</Button>
        <div><Typography.Title level={2}>Menu</Typography.Title><Typography.Paragraph type="secondary">Create and edit the items your restaurant sells.</Typography.Paragraph></div>
        {savedId && !open && <Alert type={!error && !loading && active.some(row => row.id === savedId) ? "success" : "info"} message={error || loading ? `Saved item ID: ${savedId}. ${loading ? "Checking the menu…" : "Reload the menu to check it."}` : active.some(row => row.id === savedId) ? `Saved item found in the active menu (ID: ${savedId}).` : `Saved item ID: ${savedId}. It is not in the active menu; check its availability in the list.`} />}
        {uncertain && !open && <Alert type="warning" message="Check the reloaded list for your item before trying again. Names can repeat." action={<Button onClick={acknowledgeReview}>I have checked the menu</Button>}/>}
        {error && <Alert type="warning" showIcon message={error} action={<Button onClick={() => void refresh()}>Reload menu</Button>}/>}
        <Card title="Menu items" extra={<Button type="primary" disabled={loading || !!error || uncertain} onClick={() => startEditing()}>Add item</Button>}>
          {loading ? <Spin/> : <Table rowKey="id" dataSource={definitions} columns={columns} pagination={false}
            expandable={{ expandedRowRender: row => row.kind === 'item'
              ? <div>{row.addOnGroups.length === 0 ? 'No add-ons' : row.addOnGroups.map(group => <p key={group.id}>{group.name} (up to {group.maximum}): {group.options.map(option => option.name + ' +' + option.surcharge + (option.active ? '' : ' (unavailable)')).join(', ')}</p>)}</div>
              : <div><p>Included items: {row.components.map(component => {
                  const item = definitions.find(offering => offering.kind === 'item' && offering.variants.some(variant => variant.id === component.variantId));
                  if (!item || item.kind !== 'item') return 'Unavailable item';
                  const variant = item.variants.find(value => value.id === component.variantId);
                  return item.name + (item.sized ? ' — ' + variant?.name : '') + ' × ' + component.quantity;
                }).join(', ') || 'None'}</p>{row.choiceGroups.map(group => <p key={group.id}>{group.name} (choose {group.minimum}–{group.maximum}): {group.options.map(option => option.name + ' +' + option.surcharge + (option.active ? '' : ' (unavailable)')).join(', ')}</p>)}</div> }} scroll={{ x: 680 }} locale={{ emptyText: 'No menu items yet. Add an item to get started.' }}/>}
        </Card>
      </Space>
    </main>
    <MenuForm open={open} initial={editing} offerings={definitions} currency={currency} pending={saving} error={error} blocked={uncertain || conflict}
      latest={latest} review={uncertain ? definitions : undefined}
      onReload={reloadWhileEditing}
      onUseLatest={useLatest} onClose={closeEditor} onSave={save}/>
  </div>;
}
