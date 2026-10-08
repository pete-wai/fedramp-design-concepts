import { parse } from 'devalue';
import fixture from '../data/demo/marketplace.json';
import homeFixture from '../data/demo/home-metrics.json';
import type { FedRAMPData } from '../types/marketplace';
// Frozen, validated source snapshot. There is no live data ingestion in the lab.
const marketplace = parse(fixture.serialized) as FedRAMPData;
const home = parse(homeFixture.serialized) as FedRAMPData;
export function getMarketplaceData(): FedRAMPData { return marketplace; }
export function getReferenceHomeData(): FedRAMPData { return home; }
