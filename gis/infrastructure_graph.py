"""
Vanguard City — Infrastructure Graph & Cascade Failure Engine (Phase 10 & 11)
Framework: NetworkX
Nodes:
  - Road Intersections & Segments
  - Water Treatment Plants & Reservoirs
  - Power Substations & Transformers
  - Wards
Edges:
  - Road Network Connectivity
  - Power Transmission & Feeder Lines
  - Water Distribution Pipelines
  - Ward Containment / Proximity Relationships
Metrics Calculated:
  - Degree Centrality
  - Betweenness Centrality (Critical Bottlenecks)
  - Closeness Centrality
  - Shortest Path Robustness
  - Connected Components & Resilience Index
"""
import networkx as nx
import json
import os
from typing import Dict, Any, List

class CityInfrastructureGraph:
    def __init__(self):
        self.G = nx.Graph()
        self._build_graph()

    def _build_graph(self):
        # 1. Add Ward Nodes
        for w in range(1, 16):
            self.G.add_node(
                f"ward_{w}",
                node_type="ward",
                label=f"Ward {w}",
                population=30000 + w * 4000
            )

        # 2. Add Road Intersections and Segments
        intersections = [f"int_{i}" for i in range(1, 25)]
        for int_node in intersections:
            self.G.add_node(int_node, node_type="intersection")

        # Connect road intersections in grid & ring topology
        for i in range(1, 24):
            self.G.add_edge(f"int_{i}", f"int_{i+1}", edge_type="road", capacity=1200, length_m=450)
            if i + 5 <= 24:
                self.G.add_edge(f"int_{i}", f"int_{i+5}", edge_type="road", capacity=1600, length_m=650)

        # Connect wards to nearest intersections
        for w in range(1, 16):
            target_int = f"int_{(w % 24) + 1}"
            self.G.add_edge(f"ward_{w}", target_int, edge_type="access_corridor", weight=1.0)

        # 3. Add Water Infrastructure
        water_nodes = [
            ("water_plant_north", "treatment_plant", 95.0, 1),
            ("water_plant_south", "treatment_plant", 80.0, 13),
            ("reservoir_central", "reservoir", 120.0, 9),
            ("pump_station_east", "pump_station", 60.0, 5)
        ]
        for w_id, w_type, cap, ward_num in water_nodes:
            self.G.add_node(w_id, node_type="water", asset_type=w_type, capacity=cap)
            self.G.add_edge(w_id, f"ward_{ward_num}", edge_type="water_pipeline", capacity=cap)

        # Inter-facility water pipelines
        self.G.add_edge("water_plant_north", "reservoir_central", edge_type="transmission_main", capacity=110.0)
        self.G.add_edge("water_plant_south", "reservoir_central", edge_type="transmission_main", capacity=90.0)
        self.G.add_edge("reservoir_central", "pump_station_east", edge_type="distribution_trunk", capacity=70.0)

        # 4. Add Power Infrastructure
        power_nodes = [
            ("grid_substation_north", "substation", 2500, 6),
            ("grid_substation_central", "substation", 3500, 9),
            ("industrial_transformer_t5", "transformer", 1500, 5),
            ("school_transformer_t14", "transformer", 800, 14)
        ]
        for p_id, p_type, kva, ward_num in power_nodes:
            self.G.add_node(p_id, node_type="power", asset_type=p_type, capacity_kva=kva)
            self.G.add_edge(p_id, f"ward_{ward_num}", edge_type="power_feeder")

        # High-voltage power transmission interties
        self.G.add_edge("grid_substation_north", "grid_substation_central", edge_type="hv_line", capacity=5000)
        self.G.add_edge("grid_substation_central", "industrial_transformer_t5", edge_type="hv_line", capacity=2000)

        # Cross-dependency: Water plants require power from grid substations
        self.G.add_edge("grid_substation_north", "water_plant_north", edge_type="power_dependency", critical=True)
        self.G.add_edge("grid_substation_central", "reservoir_central", edge_type="power_dependency", critical=True)

    def calculate_centrality_metrics(self) -> Dict[str, Any]:
        """
        Computes graph centrality metrics used as risk engine features.
        """
        deg_centrality = nx.degree_centrality(self.G)
        bet_centrality = nx.betweenness_centrality(self.G)
        closeness = nx.closeness_centrality(self.G)

        # Top critical bottlenecks (high betweenness)
        sorted_betweenness = sorted(bet_centrality.items(), key=lambda x: x[1], reverse=True)[:6]

        ward_metrics = {}
        for w in range(1, 16):
            w_id = f"ward_{w}"
            ward_metrics[f"Ward {w}"] = {
                "degree_centrality": round(deg_centrality.get(w_id, 0.0), 4),
                "betweenness_centrality": round(bet_centrality.get(w_id, 0.0), 4),
                "closeness_centrality": round(closeness.get(w_id, 0.0), 4),
            }

        return {
            "total_nodes": self.G.number_of_nodes(),
            "total_edges": self.G.number_of_edges(),
            "connected_components": nx.number_connected_components(self.G),
            "top_critical_bottlenecks": [
                {"node": n, "betweenness": round(b, 4), "type": self.G.nodes[n].get("node_type", "unknown")}
                for n, b in sorted_betweenness
            ],
            "ward_centrality": ward_metrics
        }

    def simulate_cascade_failure(self, failed_node: str) -> Dict[str, Any]:
        """
        Simulates cascading failure when an infrastructure asset or corridor goes offline.
        """
        H = self.G.copy()
        if failed_node not in H:
            return {"error": f"Node {failed_node} not in graph"}

        # Find directly affected dependencies
        neighbors = list(H.neighbors(failed_node))
        H.remove_node(failed_node)

        # Impact analysis
        components_after = list(nx.connected_components(H))
        isolated_nodes = [comp for comp in components_after if len(comp) < 3]

        return {
            "failed_asset": failed_node,
            "directly_disconnected_nodes": neighbors,
            "isolated_subnetworks_count": len(isolated_nodes),
            "resilience_status": "degraded" if len(components_after) > 1 else "nominal",
            "cascade_risk": "high" if len(isolated_nodes) > 0 or len(neighbors) > 3 else "moderate"
        }

if __name__ == "__main__":
    graph = CityInfrastructureGraph()
    metrics = graph.calculate_centrality_metrics()
    print("Graph Centrality Summary:")
    print(json.dumps(metrics["top_critical_bottlenecks"], indent=2))
    
    # Test cascade failure on central reservoir
    cascade = graph.simulate_cascade_failure("reservoir_central")
    print("\nCascade Failure Simulation on reservoir_central:")
    print(json.dumps(cascade, indent=2))
