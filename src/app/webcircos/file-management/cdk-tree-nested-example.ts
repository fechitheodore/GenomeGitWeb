import {NestedTreeControl} from '@angular/cdk/tree';
import {Component, Injectable} from '@angular/core';
import {MatTreeNestedDataSource} from '@angular/material/tree';
import {BehaviorSubject, of as observableOf} from 'rxjs';

/**
 * Json node data with nested structure. Each node has a filename and a value or a list of children
 */
export class FileNode {
  children: FileNode[];
  fileName: string;
  fileID: string;
  commitID: string;
  projectID: string;
  comment: string;
  type: string;
  isSelected: boolean;
}

/**
 * The Json tree data in string. The data could be parsed into Json object
 */


@Injectable()
export class FileDatabase {
  dataChange = new BehaviorSubject<FileNode[]>([]);

  get data(): FileNode[] { return this.dataChange.value; }

  constructor() {
    this.initialize();
  }

  initialize() {
    // Build the tree nodes from Json object. The result is a list of `FileNode` with nested
    //     file node as children.
    const data = this.buildFileTree(null, 0);

    // Notify the change.
    this.dataChange.next(data);
  }

  /**
   * Build the file structure tree. The `value` is the Json object, or a sub-tree of a Json object.
   * The return value is the list of `FileNode`.
   */
  buildFileTree(obj: object, level: number): FileNode[] {
    const nodes = Array() as FileNode[];
    let parentNode = new FileNode;
    parentNode.projectID="5ca38b2b0a24f137ca4e1ed2";
    parentNode.type="Fasta";
    parentNode.fileID="5ca38b3a0a24f137ca4e1ed3";
    parentNode.comment="TAIR 10";
    parentNode.fileName="Arabidopsis_thaliana.TAIR10.dna.toplevel.fa";
    parentNode.children=Array() as FileNode[];
    let childNode = new FileNode;
    childNode.projectID="5ca38b2b0a24f137ca4e1ed2";
    childNode.type="annotation";
    childNode.fileID="5ca4b5b0a7724d02da453aad";
    childNode.comment="TAIR 10 GFF";
    childNode.fileName="TAIR10_GFF3_genes.gff";
    parentNode.children.push(childNode);
    childNode = new FileNode;
    childNode.projectID="5ca38b2b0a24f137ca4e1ed2";
    childNode.type="annotation";
    childNode.fileID="5ca4b5b0a7724d02da453aad";
    childNode.comment="TAIR 11 GFF";
    childNode.fileName="TAIR11_GFF3_genes.gff";
    parentNode.children.push(childNode);
    nodes.push(parentNode);


    parentNode = new FileNode;
    parentNode.projectID="5ca38b2b0a24f137ca4e1ed2";
    parentNode.type="Fasta";
    parentNode.fileID="5ca48e4defa683021d24cace";
    parentNode.comment="TAIR 8";
    parentNode.fileName="tair8.at.chromosomes.fasta";
    parentNode.children=Array() as FileNode[];
    childNode = new FileNode;
    childNode.projectID="5ca38b2b0a24f137ca4e1ed2";
    childNode.type="annotation";
    childNode.fileID="5ca4b5d1b89cc102ea258d32";
    childNode.comment="TAIR 8 GFF";
    childNode.fileName="TAIR8_GFF3_genes.gff";
    parentNode.children.push(childNode);
    nodes.push(parentNode);

    return nodes;

  }
}

/**
 * @title Tree with nested nodes
 */
@Component({
  selector: 'cdk-tree-nested-example',
  templateUrl: 'cdk-tree-nested-example.html',
  styleUrls: ['cdk-tree-nested-example.css'],
  providers: [FileDatabase]
})
export class CdkTreeNestedExample {
  nestedTreeControl: NestedTreeControl<FileNode>;
  nestedDataSource: MatTreeNestedDataSource<FileNode>;

  constructor(database: FileDatabase) {
    this.nestedTreeControl = new NestedTreeControl<FileNode>(this._getChildren);
    this.nestedDataSource = new MatTreeNestedDataSource();

    database.dataChange.subscribe(data => this.nestedDataSource.data = data);
  }

  //hasNestedChild = (_: number, nodeData: FileNode) => !nodeData.type;
  hasNestedChild(_: number, nodeData: FileNode){
    if (nodeData.children && nodeData.children.length>0){
      return true;
    }else {
        return false;
      }
    }

  private _getChildren = (node: FileNode) => observableOf(node.children);
}

