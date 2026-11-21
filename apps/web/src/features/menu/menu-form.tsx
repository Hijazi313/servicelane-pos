import { useEffect, useState } from 'react';
import { Alert, Button, Checkbox, Col, Divider, Drawer, Flex, Form, Input, InputNumber, Modal, Row, Select, Switch, Typography } from 'antd';
import type { Definition, Offering } from './menu-api';
import { definitionFromDraft, type MenuDraft } from './menu-draft';

type Props = {
  open: boolean;
  initial?: Offering;
  offerings: Offering[];
  currency: string;
  pending: boolean;
  blocked?: boolean;
  error?: string;
  onReload: () => Promise<void>;
  latest?: Offering;
  review?: Offering[];
  onUseLatest: () => void;
  onClose: () => void;
  onSave: (definition: Definition) => Promise<void>;
};

const required = [{ required: true, message: 'This field is required.' }];
const priceRules = [
  { required: true, message: 'Enter an amount.' },
  { pattern: /^(0|[1-9]\d{0,8})(\.\d+)?$/, message: 'Enter a non-negative amount.' },
];

export function MenuForm({ open, initial, offerings, currency, pending, blocked, error, latest, review, onReload, onUseLatest, onClose, onSave }: Props) {
  const [form] = Form.useForm<MenuDraft>();
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const kind = Form.useWatch('kind', form);
  const sized = Form.useWatch('sized', form);
  const variants = offerings.flatMap(offering => offering.kind === 'item'
    ? offering.variants.filter(variant => offering.active && variant.active).map(variant => ({
      value: variant.id,
      label: offering.sized ? `${offering.name} — ${variant.name}` : offering.name,
    }))
    : []);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (initial?.kind === 'item') {
      form.setFieldsValue({ kind: 'item', name: initial.name, active: initial.active, sized: initial.sized, variants: initial.variants, addOnGroups: initial.addOnGroups });
    } else if (initial?.kind === 'combo') {
      form.setFieldsValue({ kind: 'combo', name: initial.name, active: initial.active, basePrice: initial.basePrice, components: initial.components, choiceGroups: initial.choiceGroups });
    } else {
      form.setFieldsValue({ kind: 'item', active: true, sized: false, variants: [{ name: 'Standard', price: '', active: true }], addOnGroups: [], components: [], choiceGroups: [] });
    }
  }, [open, initial?.id, form]);

  function close() {
    if (pending) return;
    if (form.isFieldsTouched()) {
      setConfirmDiscard(true);
      return;
    }
    onClose();
  }

  async function save(values: MenuDraft) {
    await onSave(definitionFromDraft(values));
  }

  return <Drawer rootClassName="menu-drawer" title={initial ? 'Edit menu item' : 'Add menu item'} open={open} onClose={close}
    width="min(680px, 100%)" destroyOnHidden={false}
    footer={<Flex justify="end" gap="small"><Button onClick={close}>Cancel</Button><Button type="primary" htmlType="submit" form="menu-form" loading={pending} disabled={blocked}>Save</Button></Flex>}>
    <Modal open={confirmDiscard} title="Discard unsaved changes?" okText="Discard changes" cancelText="Keep editing"
      okButtonProps={{ danger: true }} onCancel={() => setConfirmDiscard(false)} onOk={() => {
        setConfirmDiscard(false);
        onClose();
      }}>
      Your changes have not been saved.
    </Modal>
    {error && <Alert type="error" showIcon message={error} action={<Button onClick={() => void onReload()}>Reload menu</Button>} style={{ marginBottom: 16 }} />}
    {review && <Alert style={{ marginBottom: 16 }} type="info" message="Menu items from the last successful load" description={<ul>{review.map(row => <li key={row.id}>{row.name} · {row.kind === 'item' ? row.variants.map(variant => variant.name + ': ' + variant.price).join(', ') : row.basePrice}</li>)}</ul>} />}
    {latest && <Alert style={{ marginBottom: 16 }} type="info" message="Current saved version"
      description={<><p>{latest.name} · {latest.kind === 'item' ? latest.variants.map(row => row.name + ': ' + row.price + (row.active ? '' : ' (unavailable)')).join(', ') : latest.basePrice}</p>
        {latest.kind === 'item' ? <ul>{latest.addOnGroups.map((group, index) => <li key={group.id ?? index}>{group.name} (choose up to {group.maximum}): {group.options.map(option => option.name + ' +' + option.surcharge + (option.active ? '' : ' (unavailable)')).join(', ')}</li>)}</ul> :
          <><p>Included: {latest.components.map(component => {
            const match = variants.find(variant => variant.value === component.variantId);
            return (match?.label ?? component.variantId) + ' × ' + component.quantity;
          }).join(', ') || 'None'}</p><ul>{latest.choiceGroups.map((group, index) => <li key={group.id ?? index}>{group.name} (choose {group.minimum}–{group.maximum}): {group.options.map(option => option.name + ' (' + (variants.find(variant => variant.value === option.variantId)?.label ?? option.variantId) + ') × ' + option.quantity + ' +' + option.surcharge + (option.active ? '' : ' (unavailable)')).join(', ')}</li>)}</ul></>}
        <p>Availability: {latest.active ? 'active' : 'inactive'}. Your draft is retained while this drawer remains open.</p>
        <Button onClick={onUseLatest}>Keep my draft and use current revision</Button></>} />}
    <Form id="menu-form" form={form} layout="vertical" onFinish={save} onFinishFailed={({ errorFields }) => {
      if (errorFields[0]) form.scrollToField(errorFields[0].name, { focus: true });
    }} autoComplete="off">
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Form.Item name="kind" label="Type" rules={required}>
            <Select disabled={!!initial} options={[{ value: 'item', label: 'Item' }, { value: 'combo', label: 'Meal deal' }]} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={16}><Form.Item name="name" label="Name" rules={required}><Input maxLength={240} autoFocus /></Form.Item></Col>
      </Row>
      <Form.Item name="active" label="Available" valuePropName="checked"><Switch /></Form.Item>
      <Form.Item label="Photo" extra="Image upload coming soon."><Button disabled>Upload photo</Button></Form.Item>

      {kind === 'item' && <>
        <Form.Item name="sized" valuePropName="checked"><Checkbox disabled={initial?.kind === 'item' && initial.sized}>This item has sizes</Checkbox></Form.Item>
        <Typography.Title level={5}>{sized ? 'Sizes and prices' : 'Price'}</Typography.Title>
        <Form.List name="variants">{(fields, { add, remove }) => <>
          {fields.map(({ key, name }) => <div key={key}>
            <Form.Item name={[name, 'id']} hidden><Input /></Form.Item>
            <Row gutter={16}>
              {sized && <Col xs={24} sm={14}><Form.Item name={[name, 'name']} label="Size" rules={required}><Input /></Form.Item></Col>}
              <Col xs={24} sm={sized ? 10 : 24}><Form.Item name={[name, 'price']} label={`Price (${currency})`} rules={priceRules}><Input inputMode="decimal" /></Form.Item></Col>
            </Row>
            <Form.Item name={[name, 'active']} label="Size available" valuePropName="checked"><Switch /></Form.Item>
            {sized && !form.getFieldValue(['variants', name, 'id']) && <Button onClick={() => remove(name)}>Remove size</Button>}
            <Divider />
          </div>)}
          {sized && <Button onClick={() => add({ name: '', price: '', active: true })}>Add size</Button>}
        </>}</Form.List>
        <Typography.Title level={5}>Optional add-ons</Typography.Title>
        <Form.List name="addOnGroups">{(groups, { add, remove }) => <>
          {groups.map(({ key, name }) => <div key={key} style={{ padding: 16, border: '1px solid #d9d9d9', marginBottom: 16 }}>
            <Form.Item name={[name, 'id']} hidden><Input /></Form.Item>
            <Row gutter={16}>
              <Col xs={24} sm={14}><Form.Item name={[name, 'name']} label="Add-on group name" rules={required}><Input /></Form.Item></Col>
              <Col xs={24} sm={10}><Form.Item name={[name, 'maximum']} label="Maximum selections" rules={required}><InputNumber min={0} precision={0} /></Form.Item></Col>
            </Row>
            <Form.List name={[name, 'options']}>{(options, controls) => <>
              {options.map(option => <div key={option.key}>
                <Form.Item name={[option.name, 'id']} hidden><Input /></Form.Item>
                <Row gutter={16}>
                  <Col xs={24} sm={14}><Form.Item name={[option.name, 'name']} label="Add-on name" rules={required}><Input /></Form.Item></Col>
                  <Col xs={24} sm={10}><Form.Item name={[option.name, 'surcharge']} label={`Extra price (${currency})`} rules={priceRules}><Input inputMode="decimal" /></Form.Item></Col>
                </Row>
                <Form.Item name={[option.name, 'active']} label="Available" valuePropName="checked"><Switch /></Form.Item>
                {!form.getFieldValue(['addOnGroups', name, 'options', option.name, 'id']) && <Button onClick={() => controls.remove(option.name)}>Remove add-on</Button>}
              </div>)}
              <Button onClick={() => controls.add({ name: '', surcharge: '0', active: true })}>Add option</Button>
            </>}</Form.List>
            {!form.getFieldValue(['addOnGroups', name, 'id']) && <Button danger onClick={() => remove(name)}>Remove group</Button>}
          </div>)}
          <Button onClick={() => add({ name: '', maximum: 1, options: [{ name: '', surcharge: '0', active: true }] })}>Add add-on group</Button>
        </>}</Form.List>
      </>}

      {kind === 'combo' && <>
        <Form.Item name="basePrice" label={`Meal price (${currency})`} rules={priceRules}><Input inputMode="decimal" /></Form.Item>
        <Alert type="info" showIcon message="Save the items and sizes before adding them to a meal." />
        <Typography.Title level={5}>Included items</Typography.Title>
        <Form.List name="components">{(fields, { add, remove }) => <>
          {fields.map(({ key, name }) => <div key={key}>
            <Row gutter={16}>
              <Col xs={24} sm={14}><Form.Item name={[name, 'variantId']} label="Item or size" rules={required}><Select options={variants} showSearch optionFilterProp="label" /></Form.Item></Col>
              <Col xs={24} sm={10}><Form.Item name={[name, 'quantity']} label="Quantity" rules={required}><InputNumber min={1} max={1000} precision={0} /></Form.Item></Col>
            </Row>
            <Button onClick={() => remove(name)}>Remove included item</Button>
          </div>)}
          <Button onClick={() => add({ quantity: 1 })}>Add included item</Button>
        </>}</Form.List>
        <Typography.Title level={5}>Customer choices</Typography.Title>
        <Form.List name="choiceGroups">{(groups, { add, remove }) => <>
          {groups.map(({ key, name }) => <div key={key} style={{ padding: 16, border: '1px solid #d9d9d9', marginBottom: 16 }}>
            <Form.Item name={[name, 'id']} hidden><Input /></Form.Item>
            <Form.Item name={[name, 'name']} label="Choice group name" rules={required}><Input /></Form.Item>
            <Row gutter={16}>
              <Col xs={24} sm={12}><Form.Item name={[name, 'minimum']} label="Minimum selections" rules={required}><InputNumber min={0} precision={0} /></Form.Item></Col>
              <Col xs={24} sm={12}><Form.Item name={[name, 'maximum']} label="Maximum selections" rules={required}><InputNumber min={0} precision={0} /></Form.Item></Col>
            </Row>
            <Form.List name={[name, 'options']}>{(options, controls) => <>
              {options.map(option => <div key={option.key}>
                <Form.Item name={[option.name, 'id']} hidden><Input /></Form.Item>
                <Row gutter={16}>
                  <Col xs={24} sm={12}><Form.Item name={[option.name, 'name']} label="Choice name" rules={required}><Input /></Form.Item></Col>
                  <Col xs={24} sm={12}><Form.Item name={[option.name, 'variantId']} label="Item or size" rules={required}><Select options={variants} showSearch optionFilterProp="label" /></Form.Item></Col>
                </Row>
                <Row gutter={16}>
                  <Col xs={24} sm={12}><Form.Item name={[option.name, 'quantity']} label="Quantity" rules={required}><InputNumber min={1} max={1000} precision={0} /></Form.Item></Col>
                  <Col xs={24} sm={12}><Form.Item name={[option.name, 'surcharge']} label={`Extra price (${currency})`} rules={priceRules}><Input inputMode="decimal" /></Form.Item></Col>
                </Row>
                <Form.Item name={[option.name, 'active']} label="Available" valuePropName="checked"><Switch /></Form.Item>
                {!form.getFieldValue(['choiceGroups', name, 'options', option.name, 'id']) && <Button onClick={() => controls.remove(option.name)}>Remove choice</Button>}
              </div>)}
              <Button onClick={() => controls.add({ name: '', quantity: 1, surcharge: '0', active: true })}>Add choice</Button>
            </>}</Form.List>
            {!form.getFieldValue(['choiceGroups', name, 'id']) && <Button danger onClick={() => remove(name)}>Remove choice group</Button>}
          </div>)}
          <Button onClick={() => add({ name: '', minimum: 1, maximum: 1, options: [{ name: '', quantity: 1, surcharge: '0', active: true }] })}>Add choice group</Button>
        </>}</Form.List>
      </>}
    </Form>
  </Drawer>;
}
