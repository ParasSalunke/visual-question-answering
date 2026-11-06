"""
Generates high-resolution publication figures and a comprehensive academic PDF project report
for P34: Visual Question Answering (VQA) Studio by Paras Nitin Salunke.
"""

import os
import sys
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

# Ensure working directory is repo root
REPO_ROOT = Path(__file__).resolve().parent.parent
os.chdir(REPO_ROOT)

CHARTS_DIR = REPO_ROOT / "scripts" / "report_assets"
CHARTS_DIR.mkdir(parents=True, exist_ok=True)

def generate_charts():
    # 1. Category Accuracy & Latency Bar Chart
    fig, ax1 = plt.subplots(figsize=(7, 3.2), dpi=300)
    
    categories = ['Normal Baseline', 'Low-Light Stress', 'Cluttered Adversarial', 'Overall Dataset']
    blip_acc = [87.5, 66.7, 16.7, 60.0]
    gemini_acc = [75.0, 50.0, 33.3, 55.0]
    
    x = np.arange(len(categories))
    width = 0.35
    
    rects1 = ax1.bar(x - width/2, blip_acc, width, label='BLIP-VQA Base (PyTorch CPU)', color='#2563EB', edgecolor='#1D4ED8', zorder=3)
    rects2 = ax1.bar(x + width/2, gemini_acc, width, label='Gemini 3.5 Flash (Cloud API)', color='#0D9488', edgecolor='#0F766E', zorder=3)
    
    ax1.set_ylabel('Accuracy (%)', fontsize=9, fontweight='bold', color='#1E293B')
    ax1.set_title('Empirical Accuracy Comparison Across Visual Stress Categories (20 Pairs)', fontsize=10, fontweight='bold', pad=12, color='#0F172A')
    ax1.set_xticks(x)
    ax1.set_xticklabels(categories, fontsize=8.5, fontweight='semibold', color='#334155')
    ax1.set_ylim(0, 105)
    ax1.grid(axis='y', linestyle='--', alpha=0.5, zorder=0)
    ax1.legend(loc='upper right', fontsize=8, framealpha=0.9)
    
    # Value labels on top of bars
    for rect in rects1:
        h = rect.get_height()
        ax1.annotate(f'{h:.1f}%',
                     xy=(rect.get_x() + rect.get_width() / 2, h),
                     xytext=(0, 3), textcoords="offset points",
                     ha='center', va='bottom', fontsize=7.5, fontweight='bold', color='#1D4ED8')
    for rect in rects2:
        h = rect.get_height()
        ax1.annotate(f'{h:.1f}%',
                     xy=(rect.get_x() + rect.get_width() / 2, h),
                     xytext=(0, 3), textcoords="offset points",
                     ha='center', va='bottom', fontsize=7.5, fontweight='bold', color='#0F766E')
                     
    plt.tight_layout()
    chart1_path = CHARTS_DIR / "fig1_accuracy_comparison.png"
    plt.savefig(chart1_path, dpi=300)
    plt.close()
    print(f"Generated: {chart1_path}")

    # 2. Confidence Calibration Gap Chart
    fig, ax = plt.subplots(figsize=(6, 2.8), dpi=300)
    models = ['BLIP-VQA Base\n(PyTorch CPU)', 'Gemini 3.5 Flash\n(Cloud Multimodal)']
    correct_conf = [43.95, 95.00]
    incorrect_conf = [35.57, 55.56]
    gaps = [8.38, 39.44]
    
    x = np.arange(len(models))
    w = 0.32
    
    b1 = ax.bar(x - w/2, correct_conf, w, label='Mean Correct Confidence', color='#10B981', edgecolor='#059669', zorder=3)
    b2 = ax.bar(x + w/2, incorrect_conf, w, label='Mean Incorrect Confidence', color='#EF4444', edgecolor='#DC2626', zorder=3)
    
    ax.set_ylabel('Mean Softmax Confidence (%)', fontsize=8.5, fontweight='bold', color='#1E293B')
    ax.set_title('Confidence Calibration Gap (Separation on Model Errors)', fontsize=9.5, fontweight='bold', pad=12, color='#0F172A')
    ax.set_xticks(x)
    ax.set_xticklabels(models, fontsize=8.5, fontweight='semibold', color='#334155')
    ax.set_ylim(0, 115)
    ax.grid(axis='y', linestyle='--', alpha=0.5, zorder=0)
    ax.legend(loc='upper left', fontsize=8, framealpha=0.9)
    
    # Annotate gaps
    for i, g in enumerate(gaps):
        ax.annotate(f'Gap: +{g:.2f}%\n(Safe Fallback)',
                    xy=(x[i], max(correct_conf[i], incorrect_conf[i]) + 6),
                    ha='center', va='bottom', fontsize=7.5, fontweight='bold', color='#4338CA',
                    bbox=dict(boxstyle="round,pad=0.25", fc="#EEF2FF", ec="#C7D2FE", lw=1))
                    
    plt.tight_layout()
    chart2_path = CHARTS_DIR / "fig2_confidence_calibration.png"
    plt.savefig(chart2_path, dpi=300)
    plt.close()
    print(f"Generated: {chart2_path}")

    # 3. Failure Mode Taxonomy Donut Chart
    fig, ax = plt.subplots(figsize=(4.5, 2.8), dpi=300)
    failure_labels = ['Spatial Clutter\nDispersion (37.5%)', 'Low-Light Color\nAttenuation (25.0%)', 'Target Object\nOcclusion (12.5%)', 'High-Density\nCounting (12.5%)', 'Rare Attribute\nConfusion (12.5%)']
    sizes = [37.5, 25.0, 12.5, 12.5, 12.5]
    colors = ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#64748B']
    explode = (0.05, 0.03, 0, 0, 0)
    
    wedges, texts = ax.pie(sizes, explode=explode, labels=failure_labels, colors=colors, startangle=140,
                           textprops={'fontsize': 7.5, 'color': '#1E293B'}, wedgeprops=dict(width=0.45, edgecolor='white', lw=1.5))
                           
    ax.set_title('Empirical Failure Mode Taxonomy\n(8 Benchmark Failure Cases Analyzed)', fontsize=9, fontweight='bold', pad=8, color='#0F172A')
    
    plt.tight_layout()
    chart3_path = CHARTS_DIR / "fig3_failure_taxonomy.png"
    plt.savefig(chart3_path, dpi=300)
    plt.close()
    print(f"Generated: {chart3_path}")

if __name__ == '__main__':
    generate_charts()
