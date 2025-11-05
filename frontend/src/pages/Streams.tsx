import React from 'react';
import { useState, useCallback, useMemo } from 'react';
import { usePositionStream } from '../hooks/useSomniaStreams';
import { Position } from '../components/PositionList';
import { TopBar } from '../components/TopBar';
import { StreamsTable } from '../components/StreamsTable';
import { DetailsPanel } from '../components/DetailsPanel';
import { RescueModal } from '../components/RescueModal';

export function Streams() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<string | undefined>();
  const [modal, setModal] = useState<{open:boolean,id?:string,owner?:string,newCol?:bigint,debt?:bigint}>({open:false});
  
  const onUpdate = useCallback((entry: Position) => {
    setPositions((prev) => [entry, ...prev].slice(0, 100));
  }, []);
  usePositionStream(onUpdate);

  const tableRows = useMemo(()=>positions
    .filter(p=>!filter || p.owner.toLowerCase().includes(filter.toLowerCase()) || p.positionId.toLowerCase().includes(filter.toLowerCase()))
    .map(p=>({
      positionId:p.positionId,owner:p.owner,
      collateralUsd: p.collateralValueUSD ?? p.collateralAmount,
      debtUsd: p.debtValueUSD ?? p.debtAmount,
      healthFactor:p.healthFactor,status:p.status
    })),[positions,filter]);

  const sel = positions.find(p=>p.positionId===selected);

  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      <TopBar onSearch={setFilter} />
      <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:16}}>
        <StreamsTable
          rows={tableRows}
          onSelect={(id)=>setSelected(id)}
          onRescue={(id)=>{
            const p = positions.find(x=>x.positionId===id);
            if(!p) return; setModal({open:true,id,owner:p.owner,newCol:BigInt(p.collateralAmount)+100n,debt:BigInt(p.debtAmount)});
          }}
        />
        <DetailsPanel positionId={sel?.positionId} owner={sel?.owner} onRescue={()=>{
          if(!sel) return; setModal({open:true,id:sel.positionId,owner:sel.owner,newCol:BigInt(sel.collateralAmount)+100n,debt:BigInt(sel.debtAmount)});
        }} />
      </div>
      <RescueModal open={modal.open} onClose={()=>setModal({open:false})} positionId={modal.id||''} owner={modal.owner||''} newCollateral={modal.newCol||0n} debt={modal.debt||0n} />
    </div>
  );
}

