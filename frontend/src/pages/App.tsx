import React from 'react';
import { useState, useCallback, useMemo } from 'react';
import { usePositionStream } from '../hooks/useSomniaStreams';
import { PositionList, Position } from '../components/PositionList';
import { Alerts } from '../components/Alerts';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { StreamsTable } from '../components/StreamsTable';
import { DetailsPanel } from '../components/DetailsPanel';
import { RescueModal } from '../components/RescueModal';
import '../styles/theme.css';

export function App() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<string | undefined>();
  const [modal, setModal] = useState<{open:boolean,id?:string,owner?:string,newCol?:bigint,debt?:bigint}>({open:false});
  const [alertTick, setAlertTick] = useState(0);
  const onUpdate = useCallback((entry: Position) => {
    setPositions((prev) => [entry, ...prev].slice(0, 100));
    if (entry.status === 'at_risk') setAlertTick((t) => t + 1);
  }, []);
  usePositionStream(onUpdate);

  const tableRows = useMemo(()=>positions
    .filter(p=>p.owner.toLowerCase().includes(filter.toLowerCase()))
    .map(p=>({
      positionId:p.positionId,owner:p.owner,
      collateralUsd: p.collateralValueUSD ?? p.collateralAmount,
      debtUsd: p.debtValueUSD ?? p.debtAmount,
      healthFactor:p.healthFactor,status:p.status
    })),[positions,filter]);

  const sel = positions.find(p=>p.positionId===selected);

  return (
    <div className="rs-grid" style={{padding:16}}>
      <Sidebar />
      <main style={{display:'flex',flexDirection:'column',gap:12}}>
        <TopBar onSearch={setFilter} />
        <StreamsTable
          rows={tableRows}
          onSelect={(id)=>setSelected(id)}
          onRescue={(id)=>{
            const p = positions.find(x=>x.positionId===id);
            if(!p) return; setModal({open:true,id,owner:p.owner,newCol:BigInt(p.collateralAmount)+100n,debt:BigInt(p.debtAmount)});
          }}
        />
      </main>
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        <DetailsPanel positionId={sel?.positionId} owner={sel?.owner} onRescue={()=>{
          if(!sel) return; setModal({open:true,id:sel.positionId,owner:sel.owner,newCol:BigInt(sel.collateralAmount)+100n,debt:BigInt(sel.debtAmount)});
        }} />
      </div>
      <Alerts trigger={alertTick} />
      <RescueModal open={modal.open} onClose={()=>setModal({open:false})} positionId={modal.id||''} owner={modal.owner||''} newCollateral={modal.newCol||0n} debt={modal.debt||0n} />
    </div>
  );
}


