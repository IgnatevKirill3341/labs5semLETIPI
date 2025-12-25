import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

df = pd.read_csv("../src/results.csv")

# График 1: Throughput vs Threads (отдельная линия для каждой реализации и каждого read_ratio)
plt.figure(figsize=(14, 10))

# Уникальные соотношения чтения
read_ratios = sorted(df['read_ratio'].unique(), reverse=True)
colors = sns.color_palette("tab10", len(read_ratios))
impls = df['impl'].unique()

for i, rr in enumerate(read_ratios):
    color_map = {'Coarse': 'lightcoral', 'Fine': 'lightgreen', 'LockFree': 'lightblue'}
    for impl in impls:
        subset = df[(df['read_ratio'] == rr) & (df['impl'] == impl)]
        if not subset.empty:
            plt.plot(
                subset['threads'],
                subset['throughput'],
                marker='o',
                label=f'{impl}, R={rr}%',
                color=color_map[impl],
                alpha=0.7 + 0.3 * (1 - i / len(read_ratios))  # немного затемняем для старых
            )

plt.xscale('log', base=2)
plt.xlabel('Number of Threads (log scale)')
plt.ylabel('Throughput (ops/sec)')
plt.title('Throughput vs Number of Threads for Different Implementations and Read Ratios')
plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
plt.grid(True, which="both", ls="--", linewidth=0.5)
plt.tight_layout()
plt.savefig('throughput_vs_threads.png', dpi=150)
#plt.show()

# График 2: Throughput vs Read Ratio (при фиксированном числе потоков, например 16)
if 16 in df['threads'].values:
    df16 = df[df['threads'] == 16]
    plt.figure(figsize=(10, 6))
    for impl in impls:
        subset = df16[df16['impl'] == impl]
        if not subset.empty:
            plt.plot(
                subset['read_ratio'],
                subset['throughput'],
                marker='o',
                label=impl
            )
    plt.xlabel('Read Ratio (%)')
    plt.ylabel('Throughput (ops/sec)')
    plt.title('Throughput vs Read Ratio (16 Threads)')
    plt.gca().invert_xaxis()  # 100% чтение слева
    plt.legend()
    plt.grid(True, ls="--", linewidth=0.5)
    plt.tight_layout()
    plt.savefig('throughput_vs_read_ratio.png', dpi=150)
#    plt.show()
else:
    print("⚠️ 16-thread data not found, skipping second plot.")