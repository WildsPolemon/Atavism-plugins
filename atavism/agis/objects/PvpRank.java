package atavism.agis.objects;

import atavism.server.util.Log;

import java.io.Serializable;
import java.util.*;


public class PvpRank implements Serializable {
	public PvpRank() {
	}

	public String toString() {
		return "[PvpRank: rank=" + id + " title=" + title + ";  value=" + value + ";  currency=" + currency + "; increase="+increase+"; reduce=" + reduce + "; diff_above=" + diff_above + "; diff_below=" + diff_below + "]";
	}

	protected int id = -1;
	protected Integer value = 0;
	protected String title = "";

	protected Integer currency = -1;
	protected Integer increase = -1;
	protected Integer reduce = -1;
	protected HashMap<Integer, Integer> diff_above = new HashMap<>();
	protected HashMap<Integer, Integer> diff_below = new HashMap<>();
	protected HashMap<Integer, Integer> reduce_diff_above = new HashMap<>();
	protected HashMap<Integer, Integer> reduce_diff_below = new HashMap<>();

	protected int effectId = -1;

	public HashMap<Integer, Integer> getIncreaseDiffBelow() {
		return diff_below;
	}
	public HashMap<Integer, Integer> getReduceDiffBelow() {
		return reduce_diff_below;
	}
	public void setDiffBelow(String diff) {
		diff_below.clear();
		reduce_diff_below.clear();
		if(diff!=null && !diff.isEmpty()) {
			String[] diffs = diff.split("\\|");
			for (String d : diffs) {
				if (d != null && !d.isEmpty()) {
					String[] fs = d.split(";");
					Integer k = Integer.parseInt(fs[0]);
					try {
						Integer i = Integer.parseInt(fs[1]);
						diff_below.put(k, i);
					}catch (NumberFormatException e) {
						Log.error("PvpRank: setDiffAbove parse failed "+fs[0]+" "+fs[1]);
					}
					try {
						Integer r = Integer.parseInt(fs[2]);
						reduce_diff_below.put(k, r);
					}catch (NumberFormatException e) {
						Log.error("PvpRank: setDiffAbove parse failed "+fs[0]+" "+fs[2]);
					}
				}
			}
		}
	}
	public Integer getMaxKeyIncreaseDiffBelow() {
		Integer maxKey = diff_below.keySet()
				.stream()
				.max(Integer::compareTo)
				.orElse(-1);
		return maxKey;
	}
	public Integer getMaxKeyReduceDiffBelow() {
		Integer maxKey = reduce_diff_below.keySet()
				.stream()
				.max(Integer::compareTo)
				.orElse(-1);
		return maxKey;
	}

	//Above

	public HashMap<Integer, Integer> getIncreaseDiffAbove() {
		return diff_above;
	}
	public HashMap<Integer, Integer> getReduceDiffAbove() {
		return reduce_diff_above;
	}
	public void setDiffAbove(String diff) {
		diff_above.clear();
		reduce_diff_above.clear();
		if(diff!=null && !diff.isEmpty()) {
			String[] diffs = diff.split("\\|");
			for (String d : diffs) {
				if (d != null && !d.isEmpty()) {
					String[] fs = d.split(";");
					Integer k = Integer.parseInt(fs[0]);
					try {
						Integer i = Integer.parseInt(fs[1]);
						diff_above.put(k, i);
					}catch (NumberFormatException e) {
						Log.error("PvpRank: setDiffAbove parse failed "+fs[0]+" "+fs[1]);
					}
					try {
						Integer r = Integer.parseInt(fs[2]);
						reduce_diff_above.put(k, r);
					}catch (NumberFormatException e) {
						Log.error("PvpRank: setDiffAbove parse failed "+fs[0]+" "+fs[2]);
					}
				}
			}
		}
	}

	public Integer getMaxKeyIncreaseDiffAbove() {
		Integer maxKey = diff_above.keySet()
				.stream()
				.max(Integer::compareTo)
				.orElse(-1);
		return maxKey;
	}
	public Integer getMaxKeyReduceDiffAbove() {
		Integer maxKey = reduce_diff_above.keySet()
				.stream()
				.max(Integer::compareTo)
				.orElse(-1);
		return maxKey;
	}


	public Integer getId() {
		return id;
	}

	public void setId(Integer id) {
		this.id = id;
	}

	public Integer getValue() {
		return value;
	}

	public void setValue(Integer val) {
		this.value = value;
	}

	public Integer getCurrency() {
		return currency;
	}

	public void setCurrency(Integer currency) {
		this.currency = currency;
	}

	public Integer getIncrease() {
		return increase;
	}
	public void setIncrease(Integer increase) {
		this.increase = increase;
	}
	public Integer getReduce() {
		return reduce;
	}
	public void setReduce(Integer reduce) {
		this.reduce = reduce;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public String getTitle() {
		return title;
	}

	public void setEffectId(int effectId) {
		this.effectId = effectId;
	}

	public int getEffectId() {
		return effectId;
	}

	private static final long serialVersionUID = 1L;
}
