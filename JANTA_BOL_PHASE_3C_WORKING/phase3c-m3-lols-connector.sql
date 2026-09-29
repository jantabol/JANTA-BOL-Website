-- JANTA BOL Phase 3C M3.1 — LOLS IRL connector + generic delivery mode
-- Additive. Does not replace canonical Live/YouTube provider engine.

alter table public.live_encoder_connectors
  add column if not exists launch_delivery_mode text not null default 'DIRECT_REDIRECT';

do $$ begin
  alter table public.live_encoder_connectors
    add constraint live_encoder_connectors_delivery_mode_check
    check (launch_delivery_mode in ('DIRECT_REDIRECT','LOCAL_CLIPBOARD_BRIDGE'));
exception when duplicate_object then null; end $$;

update public.live_encoder_connectors
set launch_delivery_mode='DIRECT_REDIRECT', updated_at=now()
where connector_key='larix_android';

insert into public.live_encoder_connectors(
  connector_key,display_name,connector_kind,platform,operational_state,switch_enabled,
  launch_scheme,android_package,install_url,handler_slug,supports_rtmps,supports_auto_config,founder_note,launch_delivery_mode
) values (
  'lols_irl_android','LOLS IRL','EDGE_HOOK','ANDROID','LIMITED',true,
  'intent','gg.lols.irl','https://play.google.com/store/apps/details?id=gg.lols.irl',
  'jb-encoder-connector-lols',true,false,
  'PILOT: free/no-subscription/no-watermark candidate. Uses local clipboard bridge for Larix-format import. Must pass real YouTube Live test before READY.',
  'LOCAL_CLIPBOARD_BRIDGE'
)
on conflict(connector_key) do update set
  display_name=excluded.display_name,
  connector_kind=excluded.connector_kind,
  platform=excluded.platform,
  operational_state=excluded.operational_state,
  switch_enabled=excluded.switch_enabled,
  launch_scheme=excluded.launch_scheme,
  android_package=excluded.android_package,
  install_url=excluded.install_url,
  handler_slug=excluded.handler_slug,
  supports_rtmps=excluded.supports_rtmps,
  supports_auto_config=excluded.supports_auto_config,
  founder_note=excluded.founder_note,
  launch_delivery_mode=excluded.launch_delivery_mode,
  updated_at=now();

-- Apply `phase3c-m3-connector-delivery-mode.sql` after this migration.
